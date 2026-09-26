"""Software-renders the shipped low-poly GLBs into compact game-select art.

Run from the repository root with Python, NumPy and Pillow installed:
  python3 src/tools/renderV08Portraits.py
"""
from __future__ import annotations

import json
import math
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "src/assets/models"
OUT = ROOT / "src/assets/portraits"
HEROES = [
    "joao", "maria", "indigo", "labuta", "rosa", "elias", "silas", "ada",
    "ruth", "teo", "valeria", "tomas", "luzia", "benicio", "ines", "dynamite",
]
W, H = 512, 640
VIEW_HEIGHT = 3.28

COMPONENT = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}
SIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
CHANNELS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def glb_data(path: Path):
    blob = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", blob)
    if magic != b"glTF" or version != 2 or length != len(blob):
        raise ValueError(f"Not a valid GLB v2: {path}")
    json_size, kind = struct.unpack_from("<I4s", blob, 12)
    if kind != b"JSON":
        raise ValueError("GLB JSON chunk missing")
    doc = json.loads(blob[20:20 + json_size].decode("utf-8").rstrip(" \t\r\n\0"))
    bin_header = 20 + json_size
    bin_size, bin_kind = struct.unpack_from("<I4s", blob, bin_header)
    if bin_kind != b"BIN\0":
        raise ValueError("GLB binary chunk missing")
    return doc, memoryview(blob)[bin_header + 8:bin_header + 8 + bin_size]


def accessor(doc, binary, index):
    acc = doc["accessors"][index]
    view = doc["bufferViews"][acc["bufferView"]]
    component = acc["componentType"]
    channels = CHANNELS[acc["type"]]
    item_size = SIZE[component] * channels
    stride = view.get("byteStride", item_size)
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    fmt = "<" + COMPONENT[component] * channels
    out = np.empty((acc["count"], channels), dtype=np.float64)
    for row in range(acc["count"]):
        out[row] = struct.unpack_from(fmt, binary, start + row * stride)
    if acc.get("normalized"):
        if component == 5121:
            out /= 255.0
        elif component == 5123:
            out /= 65535.0
        elif component == 5120:
            out = np.maximum(out / 127.0, -1)
        elif component == 5122:
            out = np.maximum(out / 32767.0, -1)
    return out


def quat_matrix(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y*y + z*z), 2 * (x*y - z*w), 2 * (x*z + y*w), 0],
        [2 * (x*y + z*w), 1 - 2 * (x*x + z*z), 2 * (y*z - x*w), 0],
        [2 * (x*z - y*w), 2 * (y*z + x*w), 1 - 2 * (x*x + y*y), 0],
        [0, 0, 0, 1],
    ], dtype=np.float64)


def local_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float64).reshape(4, 4, order="F")
    t = np.eye(4)
    t[:3, 3] = node.get("translation", [0, 0, 0])
    s = np.diag([*node.get("scale", [1, 1, 1]), 1]).astype(np.float64)
    return t @ quat_matrix(node.get("rotation", [0, 0, 0, 1])) @ s


def collect_triangles(doc, binary):
    triangles = []
    materials = doc.get("materials", [])

    def walk(node_index, parent):
        node = doc["nodes"][node_index]
        transform = parent @ local_matrix(node)
        if "mesh" in node:
            gltf_mesh = doc["meshes"][node["mesh"]]
            for primitive in gltf_mesh.get("primitives", []):
                if primitive.get("mode", 4) != 4 or "POSITION" not in primitive.get("attributes", {}):
                    continue
                positions = accessor(doc, binary, primitive["attributes"]["POSITION"])
                if "indices" in primitive:
                    indices = accessor(doc, binary, primitive["indices"]).reshape(-1).astype(np.int64)
                else:
                    indices = np.arange(len(positions), dtype=np.int64)
                homogeneous = np.column_stack([positions, np.ones(len(positions))])
                world = (transform @ homogeneous.T).T[:, :3]
                color = [0.55, 0.48, 0.4, 1]
                mat_id = primitive.get("material")
                if mat_id is not None:
                    pbr = materials[mat_id].get("pbrMetallicRoughness", {})
                    color = pbr.get("baseColorFactor", color)
                vertex_colors = None
                if "COLOR_0" in primitive["attributes"]:
                    vertex_colors = accessor(doc, binary, primitive["attributes"]["COLOR_0"])
                for face in indices[:len(indices) // 3 * 3].reshape(-1, 3):
                    face_color = np.array(color[:3], dtype=np.float64)
                    if vertex_colors is not None:
                        face_color *= vertex_colors[face, :3].mean(axis=0)
                    triangles.append((world[face], face_color))
        for child in node.get("children", []):
            walk(child, transform)

    scene = doc["scenes"][doc.get("scene", 0)]
    for node in scene["nodes"]:
        walk(node, np.eye(4))
    return triangles


def srgb(value):
    value = np.clip(value, 0, 1)
    return np.where(value <= .0031308, value * 12.92, 1.055 * value ** (1 / 2.4) - .055)


def backdrop(hero):
    y = np.linspace(0, 1, H, dtype=np.float64)[:, None, None]
    top = np.array([103, 145, 166], dtype=np.float64)[None, None, :]
    horizon = np.array([224, 164, 105], dtype=np.float64)[None, None, :]
    ground = np.array([116, 79, 53], dtype=np.float64)[None, None, :]
    upper = np.clip(y / .64, 0, 1)
    lower = np.clip((y - .64) / .36, 0, 1)
    sky = top * (1 - upper) + horizon * upper
    sky = sky * (1 - lower) + ground * lower
    gradient = np.broadcast_to(sky, (H, W, 3)).copy().astype(np.uint8)
    im = Image.fromarray(gradient, "RGB")
    draw = ImageDraw.Draw(im, "RGBA")
    # Layered mesa silhouettes, matching the game's desert scene.
    shift = sum(ord(c) for c in hero) % 21 - 10
    draw.polygon([(-20, 360), (55, 302 + shift), (112, 348), (178, 289 - shift), (250, 356), (328, 309), (410, 352), (486, 292 + shift), (540, 365), (540, 470), (-20, 470)], fill=(108, 81, 66, 170))
    draw.polygon([(-20, 405), (50, 355), (110, 385), (195, 330), (265, 398), (360, 351), (435, 391), (520, 344), (540, 430), (540, 490), (-20, 490)], fill=(139, 91, 60, 130))
    draw.line([(0, 427), (W, 427)], fill=(255, 212, 151, 80), width=2)
    # Soft horizon haze; ground and model facets remain crisp.
    im = im.filter(ImageFilter.GaussianBlur(.35))
    return im


def render(hero):
    doc, binary = glb_data(MODELS / f"{hero}.glb")
    triangles = collect_triangles(doc, binary)
    camera = np.array([2.25, 1.85, 5.3], dtype=np.float64)
    target = np.array([0, 1.1, 0], dtype=np.float64)
    forward = (target - camera); forward /= np.linalg.norm(forward)
    right = np.cross(forward, np.array([0, 1, 0], dtype=np.float64)); right /= np.linalg.norm(right)
    up = np.cross(right, forward); up /= np.linalg.norm(up)
    light = np.array([-0.38, 0.82, 0.44], dtype=np.float64); light /= np.linalg.norm(light)
    px_per_unit = H / VIEW_HEIGHT
    projected = []
    for vertices, color in triangles:
        rel = vertices - camera
        depth = rel @ forward
        if np.any(depth <= .1):
            continue
        sx = W * .5 + (rel @ right) * px_per_unit
        sy = H * .5 - (rel @ up) * px_per_unit
        p = np.column_stack([sx, sy])
        a, b, c = vertices
        normal = np.cross(b - a, c - a)
        norm = np.linalg.norm(normal)
        if norm < 1e-9:
            continue
        normal /= norm
        center = vertices.mean(axis=0)
        if np.dot(normal, camera - center) <= 0:
            continue
        diffuse = max(0, float(np.dot(normal, light)))
        shade = .62 + .5 * diffuse + .035 * (center[1] / 2.3)
        base = srgb(np.array(color, dtype=np.float64)) * 255
        face = tuple(np.clip(base * shade, 0, 255).astype(np.uint8).tolist())
        outline = tuple((np.array(face) * .61).astype(np.uint8).tolist())
        projected.append((float(depth.mean()), p, face, outline))
    # Painter's ordering works well for the rigid, closed meshes in these GLBs.
    projected.sort(key=lambda item: item[0], reverse=True)
    im = backdrop(hero)
    draw = ImageDraw.Draw(im)
    for _, points, color, outline in projected:
        poly = [tuple(map(float, xy)) for xy in points]
        draw.polygon(poly, fill=color, outline=outline)
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f"{hero}.webp", "WEBP", quality=87, method=6)
    return len(projected), (OUT / f"{hero}.webp").stat().st_size


if __name__ == "__main__":
    for hero in (sys.argv[1:] or HEROES):
        count, size = render(hero)
        print(f"{hero}: {count:,} low-poly facets · {size / 1024:.0f} KiB")
