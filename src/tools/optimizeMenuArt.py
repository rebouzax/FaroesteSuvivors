"""Encode menu art for shipping; keep generation sources until visual review.

Requires Pillow. Run from the repository root: python src/tools/optimizeMenuArt.py
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / "art-generation-manifest.json").read_text(encoding="utf-8"))
report = []
for asset in manifest["assets"]:
    destination = ROOT / asset["destination"]
    source = destination if destination.exists() else Path(asset["source"])
    with Image.open(source) as image:
        portrait = "portraits" in destination.parts
        image = image.convert("RGBA" if portrait else "RGB")
        image.thumbnail((512, 768) if portrait else (768, 1152), Image.Resampling.LANCZOS)
        output = destination.with_suffix(".webp")
        image.save(output, "WEBP", quality=85, method=6)
        with Image.open(output) as encoded:
            assert encoded.size == image.size
            if portrait:
                assert "A" in encoded.getbands()
                assert encoded.getchannel("A").tobytes() == image.getchannel("A").tobytes()
        report.append({"file": str(output.relative_to(ROOT)), "before": source.stat().st_size,
                       "after": output.stat().st_size, "size": image.size})

with Image.open(ROOT / "src/assets/portraits/bento.png") as image:
    image = image.convert("RGBA")
    image.thumbnail((512, 768), Image.Resampling.LANCZOS)
    output = ROOT / "src/assets/portraits/bento-menu.webp"
    image.save(output, "WEBP", quality=85, method=6)
    report.append({"file": str(output.relative_to(ROOT)), "before": (ROOT / "src/assets/portraits/bento.png").stat().st_size,
                   "after": output.stat().st_size, "size": image.size})
print(json.dumps(report, indent=2))
print("Bytes saved:", sum(row["before"] - row["after"] for row in report))
