"""
Data Quality Check Service — 7-dimensional dataset quality analysis.

Checks:
1. Blur detection (Laplacian variance)
2. Abnormal size detection (>3σ from mean)
3. Color anomaly detection (overexposed/underexposed)
4. Duplicate detection (average hash)
5. Class imbalance analysis
6. Unlabeled image detection
7. Corrupted file detection
"""

import json
import time
import hashlib
from pathlib import Path
from typing import List, Dict, Tuple
from collections import Counter

import numpy as np
from PIL import Image

from backend.app.core.config import settings
from backend.app.models.quality import (
    QualityReport,
    QualityCheckItem,
    QualityIssue,
)

# Supported image extensions
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}


class QualityService:
    """Stateless service that runs dataset quality checks."""

    # ------------------------------------------------------------------ #
    #                       PUBLIC ENTRY POINT                            #
    # ------------------------------------------------------------------ #
    @classmethod
    def run_quality_check(cls, project_id: str) -> QualityReport:
        t0 = time.time()
        project_dir = settings.PROJECTS_DIR / project_id
        raw_dir = project_dir / "datasets" / "raw"
        anno_file = project_dir / "annotations" / "annotations.json"

        if not raw_dir.exists():
            return QualityReport(
                project_id=project_id,
                overall_grade="F",
                overall_score=0.0,
                suggestions=["找不到資料集資料夾，請先上傳影像。"],
            )

        # Gather image paths
        image_paths = sorted(
            [p for p in raw_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
        )
        total = len(image_paths)
        if total == 0:
            return QualityReport(
                project_id=project_id,
                overall_grade="F",
                overall_score=0.0,
                suggestions=["資料集為空，請先上傳影像。"],
            )

        # Load annotations
        annotations_map, categories = cls._load_annotations(anno_file)

        # Run all checks
        issues: List[QualityIssue] = []
        checks: List[QualityCheckItem] = []

        # Pre-load image metadata for size/color/blur checks
        img_meta = cls._load_image_metadata(image_paths)

        checks.append(cls._check_corrupted(image_paths, img_meta, issues))
        checks.append(cls._check_blur(image_paths, img_meta, issues))
        checks.append(cls._check_abnormal_size(image_paths, img_meta, issues))
        checks.append(cls._check_color_anomaly(image_paths, img_meta, issues))
        checks.append(cls._check_duplicates(image_paths, img_meta, issues))
        checks.append(cls._check_class_imbalance(image_paths, annotations_map, categories, issues))
        checks.append(cls._check_unlabeled(image_paths, annotations_map, issues))

        # Calculate overall score
        overall_score, overall_grade = cls._calculate_grade(checks, total)
        suggestions = cls._generate_suggestions(checks, issues)

        elapsed = round((time.time() - t0) * 1000.0, 1)

        report = QualityReport(
            project_id=project_id,
            overall_grade=overall_grade,
            overall_score=round(overall_score, 1),
            total_images=total,
            checks=checks,
            issues=issues,
            suggestions=suggestions,
            scan_time_ms=elapsed,
        )

        # Cache report to file
        report_file = project_dir / "datasets" / "quality_report.json"
        try:
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(report.model_dump(), f, indent=2, ensure_ascii=False)
        except Exception:
            pass

        return report

    @classmethod
    def get_cached_report(cls, project_id: str) -> QualityReport | None:
        report_file = settings.PROJECTS_DIR / project_id / "datasets" / "quality_report.json"
        if not report_file.exists():
            return None
        try:
            with open(report_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return QualityReport(**data)
        except Exception:
            return None

    # ------------------------------------------------------------------ #
    #                     HELPERS: DATA LOADING                           #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _load_annotations(anno_file: Path) -> Tuple[Dict[str, List[int]], List[str]]:
        """Return {filename: [cat_ids]} and [category_names]."""
        annotations_map: Dict[str, List[int]] = {}
        categories: List[str] = []
        if not anno_file.exists():
            return annotations_map, categories
        try:
            with open(anno_file, "r", encoding="utf-8") as f:
                coco = json.load(f)
            cats = coco.get("categories", [])
            categories = [c["name"] for c in sorted(cats, key=lambda x: x["id"])]
            # Build image_id → filename mapping
            img_id_to_name: Dict[int, str] = {}
            for img in coco.get("images", []):
                img_id_to_name[img["id"]] = img.get("file_name", str(img["id"]))
            for anno in coco.get("annotations", []):
                img_id = anno.get("image_id")
                fname = img_id_to_name.get(img_id, str(img_id))
                cat_id = anno.get("category_id")
                annotations_map.setdefault(fname, []).append(cat_id)
        except Exception:
            pass
        return annotations_map, categories

    @staticmethod
    def _load_image_metadata(image_paths: List[Path]) -> Dict[str, Dict]:
        """Load width, height, mean brightness, blur score, hash for each image."""
        meta: Dict[str, Dict] = {}
        for p in image_paths:
            entry: Dict = {"valid": False, "path": p}
            try:
                img = Image.open(p)
                img.verify()  # check integrity
                # Re-open after verify (verify closes the file)
                img = Image.open(p).convert("RGB")
                w, h = img.size
                entry["valid"] = True
                entry["width"] = w
                entry["height"] = h

                # Downscale for speed
                thumb = img.resize((64, 64))
                arr = np.array(thumb, dtype=np.float32)

                # Mean brightness
                gray = np.mean(arr, axis=2)
                entry["mean_brightness"] = float(np.mean(gray))

                # Blur score: Laplacian variance on grayscale
                # Simple approximation using numpy
                gray_full = np.array(img.convert("L").resize((256, 256)), dtype=np.float64)
                laplacian = (
                    gray_full[:-2, 1:-1]
                    + gray_full[2:, 1:-1]
                    + gray_full[1:-1, :-2]
                    + gray_full[1:-1, 2:]
                    - 4 * gray_full[1:-1, 1:-1]
                )
                entry["blur_score"] = float(np.var(laplacian))

                # Average hash (8x8 grayscale → bits)
                hash_img = img.convert("L").resize((8, 8))
                hash_arr = np.array(hash_img, dtype=np.float32)
                avg = np.mean(hash_arr)
                bits = (hash_arr > avg).flatten()
                entry["ahash"] = "".join("1" if b else "0" for b in bits)

            except Exception:
                entry["valid"] = False
            meta[p.name] = entry
        return meta

    # ------------------------------------------------------------------ #
    #                       CHECK IMPLEMENTATIONS                        #
    # ------------------------------------------------------------------ #
    @classmethod
    def _check_corrupted(
        cls, paths: List[Path], meta: Dict[str, Dict], issues: List[QualityIssue]
    ) -> QualityCheckItem:
        corrupted = [p for p in paths if not meta.get(p.name, {}).get("valid", False)]
        for p in corrupted:
            issues.append(
                QualityIssue(
                    image_filename=p.name,
                    issue_type="corrupted",
                    severity="high",
                    description="檔案無法開啟或已損壞",
                )
            )
        status = "pass" if len(corrupted) == 0 else "fail"
        return QualityCheckItem(
            check_name="損壞檔案偵測",
            check_icon="📀",
            status=status,
            passed_count=len(paths) - len(corrupted),
            issue_count=len(corrupted),
            total_count=len(paths),
            summary=f"發現 {len(corrupted)} 個損壞檔案" if corrupted else "所有檔案完好",
        )

    @classmethod
    def _check_blur(
        cls, paths: List[Path], meta: Dict[str, Dict], issues: List[QualityIssue]
    ) -> QualityCheckItem:
        BLUR_THRESHOLD = 100.0  # Laplacian variance below this = blurry
        valid = [(p, meta[p.name]) for p in paths if meta.get(p.name, {}).get("valid")]
        blurry = []
        for p, m in valid:
            score = m.get("blur_score", 999)
            if score < BLUR_THRESHOLD:
                blurry.append(p)
                issues.append(
                    QualityIssue(
                        image_filename=p.name,
                        issue_type="blur",
                        severity="medium",
                        description=f"影像模糊 (清晰度分數: {score:.1f}，閾值: {BLUR_THRESHOLD})",
                        value=round(score, 1),
                    )
                )
        status = "pass" if len(blurry) == 0 else ("warn" if len(blurry) <= 3 else "fail")
        return QualityCheckItem(
            check_name="模糊圖片偵測",
            check_icon="🔍",
            status=status,
            passed_count=len(valid) - len(blurry),
            issue_count=len(blurry),
            total_count=len(valid),
            summary=f"發現 {len(blurry)} 張模糊圖片" if blurry else "所有圖片清晰度良好",
        )

    @classmethod
    def _check_abnormal_size(
        cls, paths: List[Path], meta: Dict[str, Dict], issues: List[QualityIssue]
    ) -> QualityCheckItem:
        valid = [(p, meta[p.name]) for p in paths if meta.get(p.name, {}).get("valid")]
        if len(valid) < 3:
            return QualityCheckItem(
                check_name="異常尺寸偵測",
                check_icon="🖼️",
                status="pass",
                total_count=len(valid),
                passed_count=len(valid),
                summary="樣本數量不足，跳過檢測",
            )

        areas = [m["width"] * m["height"] for _, m in valid]
        mean_area = np.mean(areas)
        std_area = np.std(areas)
        threshold = 3.0

        abnormal = []
        for (p, m), area in zip(valid, areas):
            if std_area > 0 and abs(area - mean_area) > threshold * std_area:
                abnormal.append(p)
                issues.append(
                    QualityIssue(
                        image_filename=p.name,
                        issue_type="abnormal_size",
                        severity="low",
                        description=f"尺寸異常 ({m['width']}×{m['height']}，偏離平均 {abs(area - mean_area) / std_area:.1f}σ)",
                        value=float(area),
                    )
                )

        status = "pass" if len(abnormal) == 0 else "warn"
        return QualityCheckItem(
            check_name="異常尺寸偵測",
            check_icon="🖼️",
            status=status,
            passed_count=len(valid) - len(abnormal),
            issue_count=len(abnormal),
            total_count=len(valid),
            summary=f"發現 {len(abnormal)} 張尺寸異常圖片" if abnormal else "所有圖片尺寸正常",
        )

    @classmethod
    def _check_color_anomaly(
        cls, paths: List[Path], meta: Dict[str, Dict], issues: List[QualityIssue]
    ) -> QualityCheckItem:
        OVEREXPOSED_THRESHOLD = 240.0
        UNDEREXPOSED_THRESHOLD = 15.0

        valid = [(p, meta[p.name]) for p in paths if meta.get(p.name, {}).get("valid")]
        anomalies = []
        for p, m in valid:
            brightness = m.get("mean_brightness", 128)
            if brightness > OVEREXPOSED_THRESHOLD:
                anomalies.append(p)
                issues.append(
                    QualityIssue(
                        image_filename=p.name,
                        issue_type="color_anomaly",
                        severity="medium",
                        description=f"過度曝光 (平均亮度: {brightness:.0f})",
                        value=round(brightness, 1),
                    )
                )
            elif brightness < UNDEREXPOSED_THRESHOLD:
                anomalies.append(p)
                issues.append(
                    QualityIssue(
                        image_filename=p.name,
                        issue_type="color_anomaly",
                        severity="medium",
                        description=f"過度陰暗 (平均亮度: {brightness:.0f})",
                        value=round(brightness, 1),
                    )
                )

        status = "pass" if len(anomalies) == 0 else ("warn" if len(anomalies) <= 3 else "fail")
        return QualityCheckItem(
            check_name="色彩異常偵測",
            check_icon="🎨",
            status=status,
            passed_count=len(valid) - len(anomalies),
            issue_count=len(anomalies),
            total_count=len(valid),
            summary=f"發現 {len(anomalies)} 張曝光異常圖片" if anomalies else "所有圖片色彩正常",
        )

    @classmethod
    def _check_duplicates(
        cls, paths: List[Path], meta: Dict[str, Dict], issues: List[QualityIssue]
    ) -> QualityCheckItem:
        HAMMING_THRESHOLD = 5  # bits difference ≤ 5 → likely duplicate

        valid_hashes: List[Tuple[Path, str]] = []
        for p in paths:
            m = meta.get(p.name, {})
            if m.get("valid") and "ahash" in m:
                valid_hashes.append((p, m["ahash"]))

        duplicates_set: set = set()
        duplicate_pairs: List[Tuple[str, str]] = []

        for i in range(len(valid_hashes)):
            for j in range(i + 1, len(valid_hashes)):
                h1 = valid_hashes[i][1]
                h2 = valid_hashes[j][1]
                hamming = sum(c1 != c2 for c1, c2 in zip(h1, h2))
                if hamming <= HAMMING_THRESHOLD:
                    n1 = valid_hashes[i][0].name
                    n2 = valid_hashes[j][0].name
                    if n2 not in duplicates_set:
                        duplicates_set.add(n2)
                        duplicate_pairs.append((n1, n2))

        for orig, dup in duplicate_pairs:
            issues.append(
                QualityIssue(
                    image_filename=dup,
                    issue_type="duplicate",
                    severity="medium",
                    description=f"疑似與 {orig} 重複",
                )
            )

        status = "pass" if len(duplicates_set) == 0 else "warn"
        return QualityCheckItem(
            check_name="重複圖片偵測",
            check_icon="🔁",
            status=status,
            passed_count=len(valid_hashes) - len(duplicates_set),
            issue_count=len(duplicates_set),
            total_count=len(valid_hashes),
            summary=f"發現 {len(duplicates_set)} 張疑似重複圖片" if duplicates_set else "未發現重複圖片",
        )

    @classmethod
    def _check_class_imbalance(
        cls,
        paths: List[Path],
        annotations_map: Dict[str, List[int]],
        categories: List[str],
        issues: List[QualityIssue],
    ) -> QualityCheckItem:
        if not categories or not annotations_map:
            return QualityCheckItem(
                check_name="類別不平衡檢測",
                check_icon="⚠️",
                status="warn",
                total_count=len(paths),
                summary="尚無標註資料，無法檢測類別平衡",
                details=["請先完成影像標註後再進行此項檢查"],
            )

        # Count per category
        cat_counter: Counter = Counter()
        for cat_ids in annotations_map.values():
            for cid in cat_ids:
                cat_counter[cid] += 1

        counts = list(cat_counter.values())
        if not counts or max(counts) == 0:
            return QualityCheckItem(
                check_name="類別不平衡檢測",
                check_icon="⚠️",
                status="warn",
                total_count=len(paths),
                summary="標註數量為 0",
            )

        max_count = max(counts)
        min_count = min(counts)
        ratio = max_count / max(1, min_count)

        details = []
        for i, cat_name in enumerate(categories):
            c = cat_counter.get(i + 1, cat_counter.get(i, 0))
            details.append(f"{cat_name}: {c} 張")

        status = "pass" if ratio <= 2.0 else ("warn" if ratio <= 5.0 else "fail")
        if status != "pass":
            issues.append(
                QualityIssue(
                    image_filename="(全域)",
                    issue_type="class_imbalance",
                    severity="medium" if ratio <= 5.0 else "high",
                    description=f"類別不平衡比例 {ratio:.1f}:1 (最大: {max_count}, 最小: {min_count})",
                    value=round(ratio, 1),
                )
            )

        return QualityCheckItem(
            check_name="類別不平衡檢測",
            check_icon="⚠️",
            status=status,
            passed_count=len(categories),
            issue_count=1 if status != "pass" else 0,
            total_count=len(categories),
            summary=f"類別比例 {ratio:.1f}:1" + (" (需注意)" if status != "pass" else " (均衡)"),
            details=details,
        )

    @classmethod
    def _check_unlabeled(
        cls,
        paths: List[Path],
        annotations_map: Dict[str, List[int]],
        issues: List[QualityIssue],
    ) -> QualityCheckItem:
        unlabeled = [p for p in paths if p.name not in annotations_map]
        for p in unlabeled:
            issues.append(
                QualityIssue(
                    image_filename=p.name,
                    issue_type="unlabeled",
                    severity="low",
                    description="尚未標註",
                )
            )

        labeled_count = len(paths) - len(unlabeled)
        pct = (labeled_count / max(1, len(paths))) * 100.0
        status = "pass" if pct >= 90 else ("warn" if pct >= 50 else "fail")

        return QualityCheckItem(
            check_name="未標註圖片檢查",
            check_icon="🏷️",
            status=status,
            passed_count=labeled_count,
            issue_count=len(unlabeled),
            total_count=len(paths),
            summary=f"標註完成率: {pct:.0f}% ({labeled_count}/{len(paths)})",
        )

    # ------------------------------------------------------------------ #
    #                       SCORING & SUGGESTIONS                        #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _calculate_grade(checks: List[QualityCheckItem], total: int) -> Tuple[float, str]:
        if total == 0:
            return 0.0, "F"

        # Weight each check
        weights = {
            "損壞檔案偵測": 20,
            "模糊圖片偵測": 15,
            "異常尺寸偵測": 10,
            "色彩異常偵測": 12,
            "重複圖片偵測": 13,
            "類別不平衡檢測": 15,
            "未標註圖片檢查": 15,
        }

        total_weight = 0
        weighted_score = 0.0
        for c in checks:
            w = weights.get(c.check_name, 10)
            total_weight += w
            if c.status == "pass":
                weighted_score += w * 1.0
            elif c.status == "warn":
                weighted_score += w * 0.6
            else:  # fail
                weighted_score += w * 0.2

        score = (weighted_score / max(1, total_weight)) * 100.0

        if score >= 90:
            grade = "A"
        elif score >= 75:
            grade = "B"
        elif score >= 60:
            grade = "C"
        elif score >= 40:
            grade = "D"
        else:
            grade = "F"

        return score, grade

    @staticmethod
    def _generate_suggestions(checks: List[QualityCheckItem], issues: List[QualityIssue]) -> List[str]:
        suggestions: List[str] = []
        issue_types = {i.issue_type for i in issues}

        if "corrupted" in issue_types:
            suggestions.append("🗑️ 建議移除損壞的圖片檔案，這些檔案會導致訓練中斷。")
        if "blur" in issue_types:
            suggestions.append("📷 建議移除或重新拍攝模糊的圖片，模糊圖片會降低模型精度。")
        if "abnormal_size" in issue_types:
            suggestions.append("📐 建議統一圖片尺寸，或移除過大/過小的異常圖片。")
        if "color_anomaly" in issue_types:
            suggestions.append("💡 建議檢查曝光異常的圖片，可使用資料增強中的色彩抖動來增加魯棒性。")
        if "duplicate" in issue_types:
            suggestions.append("🔁 建議移除重複圖片，避免模型過度擬合到特定樣本。")
        if "class_imbalance" in issue_types:
            suggestions.append("⚖️ 建議補充少數類別的樣本，或啟用資料增強來平衡各類別數量。")
        if "unlabeled" in issue_types:
            suggestions.append("🏷️ 建議完成所有圖片的標註，未標註的圖片不會參與訓練。")

        if not suggestions:
            suggestions.append("✨ 資料集品質優良，可以放心開始訓練！")

        return suggestions
