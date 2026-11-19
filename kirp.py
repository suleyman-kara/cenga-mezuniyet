# Kare dizisinden karakter bölgesini kırpıp film şeridi yapar: python kirp.py <klasor> <x0,y0,x1,y1> <cikti.jpg> [onek]
import sys, glob, os
from PIL import Image
d, box, out = sys.argv[1], tuple(map(int, sys.argv[2].split(','))), sys.argv[3]
on = sys.argv[4] if len(sys.argv) > 4 else ''
fs = sorted(glob.glob(os.path.join(d, on + '*.jpg')), key=lambda f: (os.path.basename(f).split('_')[0], int(os.path.basename(f).rsplit('_', 1)[1][:-4]) if os.path.basename(f).rsplit('_', 1)[1][:-4].isdigit() else 0))
fs = [f for f in fs if not os.path.basename(f).startswith(('sayfa', 'serit'))]
n = len(fs); cols = min(n, 6); rows = (n + cols - 1) // cols
w = 380; h = int(w * (box[3] - box[1]) / (box[2] - box[0]))
W = Image.new('RGB', (w * cols, h * rows))
for i, f in enumerate(fs):
    W.paste(Image.open(f).crop(box).resize((w, h)), ((i % cols) * w, (i // cols) * h))
W.save(out, quality=88); print(n, 'kare ->', out)
