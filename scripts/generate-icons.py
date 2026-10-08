from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (0, 0, 0, 255)
BLUE = (60, 135, 247, 255)


def draw_dumbbell(size: int, padding_ratio: float = 0.2) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # rounded square background with slight radius for a friendlier app icon look
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)

    pad = int(size * padding_ratio)
    bar_y = size // 2
    bar_h = max(2, int(size * 0.07))
    bar_x0 = pad + int(size * 0.14)
    bar_x1 = size - pad - int(size * 0.14)
    draw.rounded_rectangle(
        [bar_x0, bar_y - bar_h // 2, bar_x1, bar_y + bar_h // 2],
        radius=bar_h // 2,
        fill=BLUE,
    )

    plate_w = int(size * 0.1)
    plate_h = int(size * 0.42)
    for cx in (pad, size - pad):
        draw.rounded_rectangle(
            [cx - plate_w // 2, bar_y - plate_h // 2, cx + plate_w // 2, bar_y + plate_h // 2],
            radius=int(plate_w * 0.3),
            fill=BLUE,
        )

    return img


for name, size in [
    ("icon-512.png", 512),
    ("icon-192.png", 192),
    ("apple-touch-icon.png", 180),
]:
    draw_dumbbell(size).save(os.path.join(OUT_DIR, name))

print("icons written to", OUT_DIR)
