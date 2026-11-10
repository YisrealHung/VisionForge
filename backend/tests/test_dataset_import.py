import io
import json
import zipfile

import pytest
from PIL import Image


def _jpg(w=100, h=50) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (120, 80, 40)).save(buf, "JPEG")
    return buf.getvalue()


def _zip(entries: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, data in entries.items():
            zf.writestr(name, data)
    return buf.getvalue()


def _import(client, pid, files):
    res = client.post(f"/api/projects/{pid}/dataset/import", files=files)
    assert res.status_code == 200, res.text
    return res.json()


def _annos(client, pid, filename):
    return client.get(f"/api/projects/{pid}/annotations/images/{filename}").json()["annotations"]


def _labeled(client, pid):
    return sum(1 for i in client.get(f"/api/projects/{pid}/images").json() if i["labeled"])


ROBOFLOW_COCO = {
    "info": {"description": "Exported from roboflow.com"},
    # Roboflow adds the dataset name as an unused placeholder category (supercategory "none").
    "categories": [
        {"id": 0, "name": "pcb", "supercategory": "none"},
        {"id": 1, "name": "short", "supercategory": "pcb"},
        {"id": 2, "name": "open", "supercategory": "pcb"},
    ],
    "images": [
        {"id": 0, "file_name": "a.jpg", "width": 100, "height": 50},
        {"id": 1, "file_name": "b.jpg", "width": 100, "height": 50},
    ],
    "annotations": [
        {"id": 1, "image_id": 0, "category_id": 2, "bbox": [10, 5, 20, 10], "area": 200, "iscrowd": 0},
        {"id": 2, "image_id": 1, "category_id": 1, "bbox": [0, 0, 50, 25], "area": 1250, "iscrowd": 0},
        {"id": 3, "image_id": 1, "category_id": 2, "bbox": [60, 10, 10, 10], "area": 100, "iscrowd": 0},
    ],
}


def test_coco_roboflow_zip_links_annotations_to_images(client, project):
    pid = project["id"]
    # An existing category shifts ids, so category ids must be remapped by name, not copied.
    client.post(f"/api/projects/{pid}/annotations/categories", json={"name": "open", "color": "#000000"})
    data = _zip({
        "train/a.jpg": _jpg(), "train/b.jpg": _jpg(),
        "train/_annotations.coco.json": json.dumps(ROBOFLOW_COCO),
    })
    res = _import(client, pid, [("files", ("raw.zip", data, "application/zip"))])

    assert res["formats"] == ["COCO"]
    assert res["imported_images"] == 2 and res["imported_annotations"] == 3 and res["labeled_images"] == 2
    assert _labeled(client, pid) == 2

    cats = {c["name"]: c["id"] for c in client.get(f"/api/projects/{pid}/annotations/categories").json()}
    assert "pcb" not in cats  # unused placeholder not created
    a = _annos(client, pid, "a.jpg")
    assert [x["category_id"] for x in a] == [cats["open"]]
    assert a[0]["bbox"] == [10, 5, 20, 10]
    assert sorted(x["category_name"] for x in _annos(client, pid, "b.jpg")) == ["open", "short"]


def test_reimport_replaces_instead_of_duplicating(client, project):
    pid = project["id"]
    data = _zip({"a.jpg": _jpg(), "b.jpg": _jpg(), "_annotations.coco.json": json.dumps(ROBOFLOW_COCO)})
    for _ in range(2):
        _import(client, pid, [("files", ("raw.zip", data, "application/zip"))])
    assert len(_annos(client, pid, "b.jpg")) == 2


@pytest.mark.parametrize("names_yaml", [
    "names: [cat, dog]\nnc: 2\n",
    "names:\n  0: cat\n  1: dog\n",  # Ultralytics dict style
])
def test_yolo_zip_converts_normalized_boxes(client, project, names_yaml):
    pid = project["id"]
    data = _zip({
        "data.yaml": names_yaml,
        "train/images/a.jpg": _jpg(100, 50),
        "train/labels/a.txt": "1 0.5 0.5 0.2 0.4\n0 0.1 0.1 0.2 0.2\n",
        "valid/images/b.jpg": _jpg(100, 50),
        "valid/labels/b.txt": "",  # background image: no boxes
    })
    res = _import(client, pid, [("files", ("yolo.zip", data, "application/zip"))])
    assert res["formats"] == ["YOLO"]
    assert res["imported_annotations"] == 2 and res["labeled_images"] == 1

    annos = {x["category_name"]: x["bbox"] for x in _annos(client, pid, "a.jpg")}
    assert annos["dog"] == [40.0, 15.0, 20.0, 20.0]  # xc=50,yc=25,w=20,h=20 px
    assert annos["cat"] == [0.0, 0.0, 20.0, 10.0]   # clamped at the image edge
    assert _annos(client, pid, "b.jpg") == []


def test_yolo_polygon_and_classes_txt_as_loose_files(client, project):
    pid = project["id"]
    files = [
        ("files", ("p.jpg", _jpg(200, 100), "image/jpeg")),
        ("files", ("p.txt", b"0 0.1 0.2 0.5 0.2 0.5 0.6 0.1 0.6\n", "text/plain")),
        ("files", ("classes.txt", b"scratch\n", "text/plain")),
    ]
    _import(client, pid, files)
    (anno,) = _annos(client, pid, "p.jpg")
    assert anno["category_name"] == "scratch"
    assert anno["bbox"] == [20.0, 20.0, 80.0, 40.0]


def test_yolo_labels_for_images_already_in_project(client, project):
    pid = project["id"]
    _import(client, pid, [("files", ("q.jpg", _jpg(), "image/jpeg"))])
    _import(client, pid, [("files", ("q.txt", b"0 0.5 0.5 1 1\n", "text/plain"))])
    assert len(_annos(client, pid, "q.jpg")) == 1


def test_unrelated_txt_and_json_are_ignored(client, project):
    pid = project["id"]
    data = _zip({"readme.jpg": _jpg(), "readme.txt": "This dataset was exported…", "meta.json": "{\"a\": 1}"})
    res = _import(client, pid, [("files", ("x.zip", data, "application/zip"))])
    assert res["formats"] == [] and res["imported_annotations"] == 0 and res["imported_images"] == 1


def test_bad_zip_is_a_400(client, project):
    res = client.post(f"/api/projects/{project['id']}/dataset/import",
                      files=[("files", ("broken.zip", b"not a zip", "application/zip"))])
    assert res.status_code == 400


def test_visionforge_export_roundtrip_has_no_duplicates(client, project, tmp_settings):
    # The export ZIP contains both COCO JSON and YOLO txt labels for the same images.
    pid = project["id"]
    data = _zip({"a.jpg": _jpg(), "b.jpg": _jpg(), "_annotations.coco.json": json.dumps(ROBOFLOW_COCO)})
    _import(client, pid, [("files", ("raw.zip", data, "application/zip"))])
    exported = client.get(f"/api/projects/{pid}/dataset/export")
    assert exported.status_code == 200

    other = client.post("/api/projects", json={"name": "copy", "description": "", "task_type": "detection"}).json()
    res = _import(client, other["id"], [("files", ("export.zip", exported.content, "application/zip"))])
    assert "COCO" in res["formats"]
    assert len(_annos(client, other["id"], "b.jpg")) == 2
    assert _labeled(client, other["id"]) == 2
