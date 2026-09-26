"""Limpa exportações repetidas do Blender e restaura os clipes do João.

Uso: python3 src/tools/integrateJoaoBlender.py modelo_exportado.glb
Saída: src/assets/models/joao.glb

O Blender 5.2 pode exportar apenas a ação ativa em cenas com ações
slotadas. Recriamos as poses descritas no script de criação do personagem
nos ossos do próprio glTF 2.0, preservando a malha e os materiais do autor.
"""

import json
import math
import struct
import sys
from pathlib import Path


OUT = Path(__file__).resolve().parents[1] / "assets" / "models" / "joao.glb"
CLIPS = ("Idle", "Walk", "Primary", "Shot", "Throw", "Whip", "Hurt")
FPS = 24


def read_glb(path):
    data = path.read_bytes()
    magic, version, size = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or size != len(data):
        raise ValueError("O arquivo não é um GLB 2.0 completo.")
    jlen, jtype = struct.unpack_from("<II", data, 12)
    if jtype != 0x4E4F534A:
        raise ValueError("GLB sem trecho JSON.")
    doc = json.loads(data[20:20 + jlen])
    bpos = 20 + jlen
    blen, btype = struct.unpack_from("<II", data, bpos)
    if btype != 0x004E4942:
        raise ValueError("GLB sem trecho binário.")
    payload = bytearray(data[bpos + 8:bpos + 8 + blen])
    if len(payload) != blen:
        raise ValueError("Trecho binário incompleto.")
    return doc, payload


def quat_mul(a, b):
    x, y, z, w = a
    u, v, t, q = b
    return (
        w * u + x * q + y * t - z * v,
        w * v - x * t + y * q + z * u,
        w * t + x * v - y * u + z * q,
        w * q - x * u - y * v - z * t,
    )


def pose_rotation(angles):
    x, y, z = (math.radians(a) / 2 for a in angles)
    qx = (math.sin(x), 0, 0, math.cos(x))
    qy = (0, math.sin(y), 0, math.cos(y))
    qz = (0, 0, math.sin(z), math.cos(z))
    # Blender XYZ: Z @ Y @ X na ordem das transformações.
    return quat_mul(quat_mul(qz, qy), qx)


def add_floats(doc, payload, vectors, arity):
    while len(payload) % 4:
        payload.append(0)
    offset = len(payload)
    flat = [value for row in vectors for value in row]
    payload.extend(struct.pack("<" + "f" * len(flat), *flat))
    view = len(doc["bufferViews"])
    doc["bufferViews"].append({
        "buffer": 0, "byteOffset": offset, "byteLength": len(flat) * 4,
    })
    accessor = len(doc["accessors"])
    entry = {
        "bufferView": view, "componentType": 5126,
        "count": len(vectors),
        "type": {1: "SCALAR", 3: "VEC3", 4: "VEC4"}[arity],
    }
    if arity == 1:
        entry["min"] = [min(row[0] for row in vectors)]
        entry["max"] = [max(row[0] for row in vectors)]
    doc["accessors"].append(entry)
    return accessor


# Poses em graus nos ossos do modelo e quadros a 24 fps.
WALK = [
    (1, {"Thigh.L": (24, 0, 0), "Shin.L": (-12, 0, 0),
         "Thigh.R": (-23, 0, 0), "Shin.R": (-4, 0, 0),
         "UpperArm.L": (-14, 0, 0), "UpperArm.R": (13, 0, 0),
         "Hips": (0, 0, -3)}, .01),
    (7, {"Shin.L": (-19, 0, 0), "Shin.R": (-12, 0, 0)}, .031),
    (13, {"Thigh.L": (-23, 0, 0), "Shin.L": (-4, 0, 0),
          "Thigh.R": (24, 0, 0), "Shin.R": (-12, 0, 0),
          "UpperArm.L": (13, 0, 0), "UpperArm.R": (-14, 0, 0),
          "Hips": (0, 0, 3)}, .01),
    (19, {"Shin.L": (-12, 0, 0), "Shin.R": (-19, 0, 0)}, .031),
    (25, {"Thigh.L": (24, 0, 0), "Shin.L": (-12, 0, 0),
          "Thigh.R": (-23, 0, 0), "Shin.R": (-4, 0, 0),
          "UpperArm.L": (-14, 0, 0), "UpperArm.R": (13, 0, 0),
          "Hips": (0, 0, -3)}, .01),
]
SHOT = [
    (1, {}, 0),
    (6, {"Chest": (-7, 0, -9), "UpperArm.R": (-63, 0, -12),
         "Forearm.R": (-20, 0, 0), "Hand.R": (-9, 0, 0),
         "Head": (0, 0, 5)}, 0),
    (9, {"Chest": (-3, 0, -7), "UpperArm.R": (-51, 0, -8),
         "Forearm.R": (-13, 0, 0), "Hand.R": (16, 0, 0)}, 0),
    (17, {}, 0),
]
WHIP = [
    (1, {}, 0),
    (6, {"Chest": (0, 0, 14), "UpperArm.L": (22, 0, 30),
         "Forearm.L": (-53, 0, -20), "Hand.L": (5, 0, 0),
         "Whip.Base": (-15, 0, 30), "Whip.Tip": (20, 0, 0)}, 0),
    (11, {"Chest": (-9, 0, -18), "UpperArm.L": (-98, 0, -25),
          "Forearm.L": (-19, 0, 0), "Hand.L": (-18, 0, 0),
          "Whip.Base": (-85, 0, -35), "Whip.Tip": (90, 0, 0)}, 0),
    (16, {"UpperArm.L": (-48, 0, -10), "Whip.Base": (-35, 0, 0),
          "Whip.Tip": (-42, 0, 0)}, 0),
    (20, {}, 0),
]
THROW = [
    (1, {}, 0),
    (8, {"Chest": (0, 0, -10), "UpperArm.R": (37, 0, -24),
         "Forearm.R": (-85, 0, 0)}, 0),
    (14, {"Chest": (-9, 0, 15), "UpperArm.R": (-104, 0, 8),
          "Forearm.R": (-14, 0, 0)}, 0),
    (23, {}, 0),
]
HURT = [
    (1, {}, 0),
    (5, {"Spine": (13, 0, 0), "Chest": (17, 0, 8),
         "Head": (14, 0, 0), "UpperArm.L": (35, 0, 15),
         "UpperArm.R": (35, 0, -15)}, -.055),
    (13, {"Spine": (-5, 0, 0), "Head": (-5, 0, 0)}, 0),
    (20, {}, 0),
]
POSES = {
    "Walk": WALK, "Primary": SHOT, "Shot": SHOT,
    "Throw": THROW, "Whip": WHIP, "Hurt": HURT,
}


def make_clip(doc, payload, name, frames, bone_nodes):
    times = [((frame - 1) / FPS,) for frame, _, _ in frames]
    timeline = add_floats(doc, payload, times, 1)
    clip = {"name": name, "channels": [], "samplers": []}
    active = sorted(set().union(*(pose.keys() for _, pose, _ in frames)))
    for bone in active:
        node_id = bone_nodes[bone]
        rest = doc["nodes"][node_id].get("rotation", [0, 0, 0, 1])
        quats = [
            quat_mul(rest, pose_rotation(pose.get(bone, (0, 0, 0))))
            for _, pose, _ in frames
        ]
        output = add_floats(doc, payload, quats, 4)
        sampler_id = len(clip["samplers"])
        clip["samplers"].append({
            "input": timeline, "output": output, "interpolation": "LINEAR",
        })
        clip["channels"].append({
            "sampler": sampler_id,
            "target": {"node": node_id, "path": "rotation"},
        })
    if any(bounce for _, _, bounce in frames):
        node_id = bone_nodes["Root"]
        x, y, z = doc["nodes"][node_id].get("translation", [0, 0, 0])
        positions = [(x, y, z + bounce) for _, _, bounce in frames]
        output = add_floats(doc, payload, positions, 3)
        sampler_id = len(clip["samplers"])
        clip["samplers"].append({
            "input": timeline, "output": output, "interpolation": "LINEAR",
        })
        clip["channels"].append({
            "sampler": sampler_id,
            "target": {"node": node_id, "path": "translation"},
        })
    return clip


def integrate(src, dest=OUT):
    doc, payload = read_glb(src)
    scene = doc["scenes"][doc.get("scene", 0)]
    roots = [n for n in scene["nodes"]
             if doc["nodes"][n].get("name", "").startswith("FS_Joao_Rig")]
    if not roots:
        raise ValueError("O modelo não contém a armadura FS_Joao_Rig.")
    root = roots[0]
    keep = set()

    def visit(i):
        if i in keep:
            return
        keep.add(i)
        for child in doc["nodes"][i].get("children", []):
            visit(child)

    visit(root)
    if keep != set(range(root + 1)):
        raise ValueError("A hierarquia do primeiro João não é contígua.")
    scene["nodes"] = [root]
    doc["nodes"] = doc["nodes"][:root + 1]
    referenced_meshes = {node["mesh"] for node in doc["nodes"] if "mesh" in node}
    if referenced_meshes != set(range(max(referenced_meshes) + 1)):
        raise ValueError("A tabela de malhas do João não é contígua.")
    doc["meshes"] = doc["meshes"][:max(referenced_meshes) + 1]
    doc["skins"] = doc["skins"][:1]
    if any(n.get("skin", 0) != 0 for n in doc["nodes"]):
        raise ValueError("Uma malha do primeiro João usa outra armadura.")
    mat_ids = {p["material"] for m in doc["meshes"]
               for p in m["primitives"] if "material" in p}
    if mat_ids and mat_ids == set(range(max(mat_ids) + 1)):
        doc["materials"] = doc["materials"][:max(mat_ids) + 1]

    # Descarta ações da cópia .001 e preserva todas as ações válidas do original.
    animations = {}
    for clip in doc.get("animations", []):
        if all(channel["target"]["node"] in keep for channel in clip["channels"]):
            animations.setdefault(clip.get("name"), clip)
    if "Idle" not in animations:
        raise ValueError("A animação Idle do João não foi exportada.")
    bone_nodes = {
        node["name"]: i for i, node in enumerate(doc["nodes"])
        if "name" in node
    }
    for name, frames in POSES.items():
        if name not in animations:
            animations[name] = make_clip(doc, payload, name, frames, bone_nodes)
    doc["animations"] = [animations[name] for name in CLIPS]
    doc["buffers"][0]["byteLength"] = len(payload)

    json_chunk = json.dumps(doc, separators=(",", ":"), ensure_ascii=False).encode()
    json_chunk += b" " * (-len(json_chunk) % 4)
    payload.extend(b"\0" * (-len(payload) % 4))
    length = 12 + 8 + len(json_chunk) + 8 + len(payload)
    result = (struct.pack("<4sII", b"glTF", 2, length) +
              struct.pack("<II", len(json_chunk), 0x4E4F534A) + json_chunk +
              struct.pack("<II", len(payload), 0x004E4942) + payload)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(result)
    print(f"{dest}: {len(result)} bytes; {len(doc['nodes'])} nós; "
          f"{len(doc['skins'])} armadura; {', '.join(CLIPS)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python3 src/tools/integrateJoaoBlender.py modelo.glb")
    integrate(Path(sys.argv[1]))
