#!/usr/bin/env python3
"""
MAKE THE BADGE IMAGES
Usage: python3 tools/make-badge-images.py   (needs Pillow: pip install pillow)

Source: the PokeAPI sprites repository (https://github.com/PokeAPI/sprites, sprites/badges/N.png): the official
gym badge art. Each badge is cropped, scaled down to a 40 px icon, reduced to a small palette and saved as
images/badges/<gen>-<gym>.png, so it reads as pixel art in the badge case (the game draws it with
image-rendering: pixelated). The badge files in the repo are numbered by badge, see MAP below.
"""

import io
import os
import urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "images", "badges")
BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges"

# Our badge id (Challenge Gen - gym number in battle order) → file number in the PokeAPI repo.
# Kanto 1–8, Johto 9–16, Hoenn 17–24. Sinnoh 25–32 are stored in badge-case order (Coal, Forest, Cobble, Fen, Relic,
# Mine, Icicle, Beacon), our gyms come in battle order (Coal, Forest, Relic, Cobble, Fen, Mine, Icicle, Beacon).
# Unova (Black 2 / White 2): Basic 34, Toxic 35, Insect 36, Bolt 37, Quake 38, Jet 39, Legend 41, Wave 42.
MAP = {}
for gym in range(1, 9):
    MAP[f"1-{gym}"] = gym
    MAP[f"2-{gym}"] = 8 + gym
    MAP[f"3-{gym}"] = 16 + gym
for gym, n in zip(range(1, 9), [25, 26, 29, 27, 28, 30, 31, 32]):
    MAP[f"4-{gym}"] = n
for gym, n in zip(range(1, 9), [34, 35, 36, 37, 38, 39, 41, 42]):
    MAP[f"5-{gym}"] = n

SIZE = 40  # icon size in pixels
COLORS = 24  # palette size


def pixelate(img):
    img = img.convert("RGBA")
    box = img.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    img = img.crop(box)
    scale = (SIZE - 2) / max(img.size)
    small = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(small, ((SIZE - small.width) // 2, (SIZE - small.height) // 2))
    alpha = canvas.getchannel("A").point(lambda a: 255 if a >= 128 else 0)  # hard edges, no soft halo
    rgb = canvas.convert("RGB").quantize(colors=COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for badge, n in MAP.items():
        if n not in cache:
            with urllib.request.urlopen(f"{BASE}/{n}.png") as res:
                cache[n] = Image.open(io.BytesIO(res.read()))
        pixelate(cache[n]).save(os.path.join(OUT, f"{badge}.png"))
    print(f"{len(MAP)} badge images in images/badges/")


if __name__ == "__main__":
    main()
