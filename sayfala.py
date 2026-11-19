# Tam kareleri küçültüp ızgaraya dizer: python sayfala.py <klasor> <cikti.jpg> <onek1,onek2,...> [sutun]
import sys, glob, os
from PIL import Image
d, out, onek = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
fs = []
for p in onek:
    fs += sorted(glob.glob(os.path.join(d, p + '_*.jpg')), key=lambda f: int(os.path.basename(f).rsplit('_', 1)[1][:-4]))
rows = (len(fs) + cols - 1) // cols; w = 1920 // cols * 1; w = min(w, 640); h = w * 9 // 16
W = Image.new('RGB', (w * cols, h * rows))
for i, f in enumerate(fs):
    W.paste(Image.open(f).resize((w, h)), ((i % cols) * w, (i // cols) * h))
W.save(out, quality=85); print(len(fs), 'kare ->', out)
