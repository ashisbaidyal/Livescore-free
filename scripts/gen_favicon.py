"""Generate favicon.ico (multi-size ICO) from logo-mark PNG."""
from PIL import Image
import sys, os

SOURCE = sys.argv[1]
OUT_DIR = sys.argv[2]

img = Image.open(SOURCE).convert("RGBA")

# Make square
w, h = img.size
side = max(w, h)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(img, ((side - w) // 2, (side - h) // 2))

# Generate multi-size ICO (16, 32, 48)
sizes = [(16, 16), (32, 32), (48, 48)]
ico_path = os.path.join(OUT_DIR, "favicon.ico")
square.save(ico_path, format="ICO", sizes=sizes)

file_size = os.path.getsize(ico_path)
print(f"  OK favicon.ico ({file_size:,} bytes) with sizes {sizes}")
print("Done!")
