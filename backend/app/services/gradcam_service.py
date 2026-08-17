"""
Grad-CAM Service — Model attention visualization using gradient-weighted class activation mapping.

Extracts the last convolutional layer's feature maps and gradients,
computes a weighted heatmap, and overlays it on the original image.
"""

import io
import time
import base64
from typing import List, Optional, Tuple

import numpy as np
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms

from backend.app.models.gradcam import GradCamResponse, GradCamRegion
from backend.app.services.export_service import ExportService


class GradCAM:
    """Core Grad-CAM computation engine."""

    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None

        # Register hooks
        self._fwd_hook = target_layer.register_forward_hook(self._save_activation)
        self._bwd_hook = target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, target_class: Optional[int] = None) -> np.ndarray:
        """Generate Grad-CAM heatmap for the given input.

        Returns a 2D numpy array (H, W) with values in [0, 1].
        """
        self.model.eval()
        output = self.model(input_tensor)

        if target_class is None:
            target_class = output.argmax(dim=1).item()

        # Zero gradients
        self.model.zero_grad()

        # Backward pass for target class
        one_hot = torch.zeros_like(output)
        one_hot[0, target_class] = 1.0
        output.backward(gradient=one_hot, retain_graph=True)

        # Get gradients and activations
        gradients = self.gradients  # [1, C, H, W]
        activations = self.activations  # [1, C, H, W]

        if gradients is None or activations is None:
            # Fallback: return uniform heatmap
            return np.ones((7, 7), dtype=np.float32) * 0.5

        # Global average pooling of gradients → channel weights
        weights = gradients.mean(dim=(2, 3), keepdim=True)  # [1, C, 1, 1]

        # Weighted combination of activation maps
        cam = (weights * activations).sum(dim=1, keepdim=True)  # [1, 1, H, W]
        cam = F.relu(cam)  # Only positive contributions

        # Normalize to [0, 1]
        cam = cam.squeeze().cpu().numpy()
        if cam.max() > 0:
            cam = cam / cam.max()

        return cam

    def remove_hooks(self):
        self._fwd_hook.remove()
        self._bwd_hook.remove()


def _find_last_conv_layer(model: nn.Module) -> Optional[nn.Module]:
    """Find the last Conv2d layer in the model."""
    last_conv = None
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            last_conv = module
    return last_conv


def _heatmap_to_colormap(heatmap: np.ndarray, size: Tuple[int, int]) -> np.ndarray:
    """Convert a 2D heatmap to a colorized RGBA image using a jet-like colormap.
    
    Pure numpy implementation — no matplotlib dependency.
    """
    # Resize heatmap to target size
    h_img = Image.fromarray((heatmap * 255).astype(np.uint8), mode="L")
    h_img = h_img.resize(size, Image.BILINEAR)
    heatmap_resized = np.array(h_img, dtype=np.float32) / 255.0

    # Jet colormap approximation (R, G, B channels)
    r = np.clip(1.5 - np.abs(heatmap_resized - 0.75) * 4, 0, 1)
    g = np.clip(1.5 - np.abs(heatmap_resized - 0.5) * 4, 0, 1)
    b = np.clip(1.5 - np.abs(heatmap_resized - 0.25) * 4, 0, 1)

    colormap = np.stack([r, g, b], axis=-1)
    return (colormap * 255).astype(np.uint8)


def _image_to_base64(pil_img: Image.Image) -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _analyze_regions(heatmap: np.ndarray) -> List[GradCamRegion]:
    """Divide heatmap into a 3×3 grid and report contribution of each region."""
    h, w = heatmap.shape
    region_names = [
        "左上", "上中", "右上",
        "左中", "中心", "右中",
        "左下", "下中", "右下",
    ]
    results = []
    total = heatmap.sum() + 1e-8
    h3, w3 = h // 3, w // 3

    for i in range(3):
        for j in range(3):
            r_start = i * h3
            r_end = h if i == 2 else (i + 1) * h3
            c_start = j * w3
            c_end = w if j == 2 else (j + 1) * w3
            region_val = heatmap[r_start:r_end, c_start:c_end].sum()
            pct = (region_val / total) * 100.0
            results.append(GradCamRegion(
                region_name=region_names[i * 3 + j],
                contribution_pct=round(pct, 1),
            ))

    # Sort by contribution descending
    results.sort(key=lambda x: x.contribution_pct, reverse=True)
    return results[:5]  # Top 5


class GradCamService:
    @classmethod
    def generate_gradcam(cls, project_id: str, image_bytes: bytes) -> GradCamResponse:
        t0 = time.time()

        # Load model
        model, classes, architecture_str = ExportService._load_model(project_id)
        model.eval()

        # Find target layer
        target_layer = _find_last_conv_layer(model)
        if target_layer is None:
            return GradCamResponse(
                success=False,
                original_image_b64="",
                heatmap_overlay_b64="",
                heatmap_only_b64="",
                predicted_label="",
                predicted_confidence=0.0,
                message="無法找到模型的卷積層，此模型可能不支援 Grad-CAM。",
            )

        # Prepare image
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"無法解析圖片: {e}")

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        input_tensor = transform(pil_img).unsqueeze(0)
        input_tensor.requires_grad_(True)

        # Run Grad-CAM
        gradcam = GradCAM(model, target_layer)
        try:
            # Forward pass for prediction
            with torch.no_grad():
                logits = model(input_tensor)
                probs = torch.softmax(logits, dim=1)[0]
                top_idx = probs.argmax().item()
                top_conf = probs[top_idx].item() * 100.0
                top_label = classes[top_idx] if top_idx < len(classes) else f"類別_{top_idx}"

            # Re-run with gradients enabled for Grad-CAM
            input_tensor_grad = transform(pil_img).unsqueeze(0)
            input_tensor_grad.requires_grad_(True)
            heatmap = gradcam.generate(input_tensor_grad, target_class=top_idx)
        finally:
            gradcam.remove_hooks()

        # Generate visualizations
        display_img = pil_img.resize((224, 224))
        original_arr = np.array(display_img)

        # Heatmap colorized
        colorized = _heatmap_to_colormap(heatmap, (224, 224))

        # Overlay (blend 60% original + 40% heatmap)
        overlay = (original_arr.astype(np.float32) * 0.6 + colorized.astype(np.float32) * 0.4)
        overlay = np.clip(overlay, 0, 255).astype(np.uint8)

        # Region analysis
        regions = _analyze_regions(heatmap)

        elapsed = round((time.time() - t0) * 1000.0, 2)

        return GradCamResponse(
            success=True,
            original_image_b64=_image_to_base64(display_img),
            heatmap_overlay_b64=_image_to_base64(Image.fromarray(overlay)),
            heatmap_only_b64=_image_to_base64(Image.fromarray(colorized)),
            predicted_label=top_label,
            predicted_confidence=round(top_conf, 2),
            top_regions=regions,
            inference_time_ms=elapsed,
            message=f"模型判斷: {top_label} ({top_conf:.1f}%)",
        )
