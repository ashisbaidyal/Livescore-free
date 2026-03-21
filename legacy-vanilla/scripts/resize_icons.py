"""Resize the user's logo into all required PWA/favicon sizes."""
from PIL import Image
import sys, os

SOURCE = sys.argv[1]
OUT_DIR = sys.argv[2]

SIZES = {
    "logo-mark-16.png": 16,
    "logo-mark-32.png": 32,
    "logo-mark.png": 128,
    "logo-mark-180.png": 180,
    "logo-mark-192.png": 192,
    "logo-mark-512.png": 512,
}

img = Image.open(SOURCE).convert("RGBA")

# Make the image square by centering in a square canvas
w, h = img.size
side = max(w, h)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(img, ((side - w) // 2, (side - h) // 2))

for name, size in SIZES.items():
    resized = square.resize((size, size), Image.LANCZOS)
    out_path = os.path.join(OUT_DIR, name)
    resized.save(out_path, "PNG")
    file_size = os.path.getsize(out_path)
    print(f"  OK {name} ({size}x{size}) - {file_size:,} bytes")

print(f"\nDone! {len(SIZES)} icons generated.")
