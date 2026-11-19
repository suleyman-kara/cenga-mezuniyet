# Tarayıcının kaydettiği parçalı MP4'te başlıktaki süre alanları boş kalıyor (oynatıcılar yanlış süre gösterir).
# Bu betik yalnızca başlıktaki süre alanlarını gerçek süreyle doldurur; görüntü ve ses verisine dokunmaz.
# Kullanım: python video_sure_duzelt.py <dosya.mp4> ...
import struct, sys, cv2
def atoms(f, start, end):
    f.seek(start)
    while f.tell() < end:
        pos = f.tell(); h = f.read(8)
        if len(h) < 8: return
        size, typ = struct.unpack('>I4s', h); hdr = 8
        if size == 1: size = struct.unpack('>Q', f.read(8))[0]; hdr = 16
        if size < 8: return
        yield typ, pos, size, hdr
        f.seek(pos + size)
for p in sys.argv[1:]:
    c = cv2.VideoCapture(p); T = c.get(cv2.CAP_PROP_FRAME_COUNT) / c.get(cv2.CAP_PROP_FPS); c.release()
    with open(p, 'r+b') as f:
        moov = next(a for a in atoms(f, 0, 4096) if a[0] == b'moov')
        ms = None; n = 0
        def yaz(pos, hdr, alan_ts, alan_dur, olcek=None):
            global n
            f.seek(pos + hdr); ver = f.read(1)[0]
            if ver != 1: raise SystemExit('beklenmeyen sürüm')
            f.seek(pos + hdr + 4 + alan_ts); ts = struct.unpack('>I', f.read(4))[0] if olcek is None else olcek
            f.seek(pos + hdr + 4 + alan_dur); f.write(struct.pack('>Q', int(T * ts))); n += 1
            return ts
        for typ, pos, size, hdr in list(atoms(f, moov[1] + moov[3], moov[1] + moov[2])):
            if typ == b'mvhd': ms = yaz(pos, hdr, 16, 20)
        for typ, pos, size, hdr in list(atoms(f, moov[1] + moov[3], moov[1] + moov[2])):
            if typ == b'trak':
                for t2, p2, s2, h2 in list(atoms(f, pos + hdr, pos + size)):
                    if t2 == b'tkhd': yaz(p2, h2, 0, 24, ms)      # v1: created(8) modified(8) track_id(4) reserved(4) duration(8)
                    if t2 == b'mdia':
                        for t3, p3, s3, h3 in list(atoms(f, p2 + h2, p2 + s2)):
                            if t3 == b'mdhd': yaz(p3, h3, 16, 20)
    c = cv2.VideoCapture(p); ok = c.set(cv2.CAP_PROP_POS_MSEC, (T - 20) * 1000); r, _ = c.read(); c.release()
    print(f'{p}: {T / 60:.1f} dk, {n} alan yazıldı, sondan 20 sn önceki kare okundu: {r}')
