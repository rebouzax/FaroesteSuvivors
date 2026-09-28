"""Encode generated hero covers for the game; preserve the original PNGs."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
manifest = json.loads((root / 'hero-art-manifest.json').read_text(encoding='utf-8'))
total = 0
for asset in manifest['assets']:
    destination = (root / asset['destination']).resolve()
    if not destination.is_relative_to(root / 'src' / 'assets' / 'portraits' / 'heroic'):
        raise ValueError('Unexpected asset destination')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(asset['source']) as image:
        # Format conversion only: retain the complete generated composition.
        image.convert('RGB').save(destination, 'WEBP', quality=85, method=6)
    total += destination.stat().st_size
print(f"Packaged {len(manifest['assets'])} covers: {total / 1024 / 1024:.2f} MiB")
