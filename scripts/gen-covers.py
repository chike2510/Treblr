# Generates designed fictional album-cover artworks (600x600) into public/assets/covers
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S = 2
W = 600 * S
F = '/usr/share/fonts/truetype/'
def font(p, sz): return ImageFont.truetype(F + p, int(sz * S))
SB = 'freefont/FreeSansBold.ttf'; SERI = 'liberation/LiberationSerif-BoldItalic.ttf'; MONO = 'liberation/LiberationMono-Bold.ttf'
def grad(c1, c2):
    t = np.broadcast_to(np.linspace(0, 1, W)[:, None], (W, W))[..., None]
    a = np.array(c1)[None, None, :]; b = np.array(c2)[None, None, :]
    return Image.fromarray((a * (1 - t) + b * t).astype('uint8'), 'RGB')
def grain(im, amt=14, seed=1):
    rng = np.random.default_rng(seed); a = np.array(im).astype(float)
    a += rng.normal(0, amt, a.shape[:2])[..., None]
    return Image.fromarray(a.clip(0, 255).astype('uint8'))
def text(d, xy, s, f, fill, anchor='la'):
    d.text((xy[0] * S, xy[1] * S), s, font=f, fill=fill, anchor=anchor)
def save(im, name):
    im.resize((600, 600), Image.LANCZOS).convert('RGB').save('public/assets/covers/%s.jpg' % name, quality=90)

def sunrise():
    im = grad((255, 120, 40), (120, 20, 90)); d = ImageDraw.Draw(im)
    for i in range(9):
        r = (330 - i * 34) * S; c = [(255, 214, 64), (255, 150, 40), (255, 90, 70), (240, 60, 120)][i % 4]
        d.ellipse([300 * S - r, 260 * S - r, 300 * S + r, 260 * S + r], fill=c)
    rng = random.Random(3); x = 0
    while x < 600:
        w = rng.randint(24, 52); h = rng.randint(70, 210)
        d.rectangle([x * S, (470 - h) * S, (x + w) * S, 520 * S], fill=(40, 10, 50))
        for wy in range(470 - h + 10, 500, 18):
            for wx in range(x + 6, x + w - 6, 12):
                if rng.random() < .5: d.rectangle([wx * S, wy * S, (wx + 5) * S, (wy + 8) * S], fill=(255, 200, 80))
        x += w + 4
    d.rectangle([0, 500 * S, W, W], fill=(40, 10, 50))
    for k in range(0, 600, 40): d.polygon([(k * S, 520 * S), ((k + 20) * S, 560 * S), ((k + 40) * S, 520 * S)], fill=(255, 150, 40))
    text(d, (300, 566), 'GOLDEN HOUR LAGOS', font(SB, 28), (255, 225, 150), 'mm')
    text(d, (24, 24), 'KOJO AYO', font(SB, 22), (255, 240, 200))
    return grain(im, 8, 1)
def crown():
    im = grad((10, 10, 12), (70, 0, 10)); d = ImageDraw.Draw(im)
    for r in range(260, 40, -18):
        a = int(255 * (1 - r / 260)); d.ellipse([(300 - r) * S, (330 - r) * S, (300 + r) * S, (330 + r) * S], outline=(a // 2 + 30, 0, 0), width=3 * S)
    pts = [(130, 380), (110, 200), (210, 290), (300, 150), (390, 290), (490, 200), (470, 380)]
    d.polygon([(x * S, y * S) for x, y in pts], fill=(200, 200, 210))
    for a, b, c in [(0, 1, 2), (2, 3, 4), (4, 5, 6), (0, 2, 6), (2, 4, 6)]:
        v = random.Random(a * 7 + b).randint(90, 255)
        d.polygon([(pts[a][0] * S, pts[a][1] * S), (pts[b][0] * S, pts[b][1] * S), (pts[c][0] * S, pts[c][1] * S)], fill=(v, v, min(255, v + 12)), outline=(20, 20, 20))
    d.rectangle([130 * S, 380 * S, 470 * S, 420 * S], fill=(150, 150, 160))
    for x in (160, 300, 440): d.ellipse([(x - 9) * S, 392 * S, (x + 9) * S, 410 * S], fill=(220, 20, 40))
    text(d, (300, 500), 'NO MERCY', font(SB, 74), (235, 235, 240), 'mm')
    text(d, (300, 560), 'SKEPTA OKAFOR', font(SB, 20), (255, 120, 130), 'mm')
    a = np.array(im).astype(float); a[::6 * S] *= 0.8
    return grain(Image.fromarray(a.astype('uint8')), 12, 2)
def synth():
    im = grad((20, 0, 60), (255, 60, 150)); d = ImageDraw.Draw(im)
    d.ellipse([150 * S, 110 * S, 450 * S, 410 * S], fill=(255, 210, 60))
    for i in range(2, 12):
        y = (250 + i * i * 1.6) * S; d.rectangle([0, y, W, y + (2 + i * 0.7) * S], fill=(60, 0, 90))
    d.rectangle([0, 330 * S, W, W], fill=(15, 0, 35))
    for i in range(-12, 13):
        d.line([(300 * S, 330 * S), ((300 + i * 90) * S, 600 * S)], fill=(255, 50, 220), width=2 * S)
    for j in range(8):
        y = (330 + (j / 7) ** 2 * 270) * S; d.line([(0, y), (W, y)], fill=(0, 230, 255), width=2 * S)
    for px in (60, 540):
        d.rectangle([(px - 4) * S, 250 * S, (px + 4) * S, 330 * S], fill=(10, 0, 25))
        for a in range(-3, 4): d.line([(px * S, 250 * S), ((px + a * 22) * S, (215 + abs(a) * 14) * S)], fill=(10, 0, 25), width=5 * S)
    text(d, (300, 70), 'NEON  DRIVE', font(SB, 56), (0, 240, 255), 'mm')
    text(d, (300, 116), 'THE MIDNIGHT RUNNERS', font(SB, 18), (255, 230, 250), 'mm')
    return grain(im, 6, 3)
def folk():
    im = grad((226, 214, 186), (196, 206, 196)); d = ImageDraw.Draw(im)
    d.ellipse([330 * S, 60 * S, 530 * S, 260 * S], fill=(246, 238, 214))
    for i, (c, y) in enumerate([((150, 168, 150), 330), ((100, 130, 118), 380), ((60, 92, 92), 430)]):
        pts = [(0, W)] + [(x * S, (y + 22 * math.sin(x / 70 + i * 2)) * S) for x in range(0, 610, 10)] + [(W, W)]
        d.polygon(pts, fill=c)
    rng = random.Random(5)
    for k in range(26):
        x = rng.randint(0, 600); y = rng.randint(380, 540); h = rng.randint(60, 120)
        d.polygon([(x * S, (y - h) * S), ((x - h * .28) * S, y * S), ((x + h * .28) * S, y * S)], fill=(30, 58, 60))
        d.rectangle([(x - 2) * S, y * S, (x + 2) * S, (y + 10) * S], fill=(40, 30, 30))
    d.polygon([(110 * S, 440 * S), (150 * S, 400 * S), (190 * S, 440 * S)], fill=(150, 70, 50))
    d.rectangle([118 * S, 440 * S, 182 * S, 480 * S], fill=(230, 190, 110)); d.rectangle([140 * S, 452 * S, 158 * S, 480 * S], fill=(80, 50, 40))
    text(d, (300, 555), 'Quiet Pines', font(SERI, 52), (246, 238, 214), 'mm')
    text(d, (24, 28), 'wren and the hollow', font(SERI, 20), (70, 70, 60))
    return grain(im, 10, 4)
def violet():
    im = grad((30, 10, 70), (250, 170, 60)); rng = np.random.default_rng(9)
    for i in range(14):
        x, y, r = int(rng.integers(0, W)), int(rng.integers(0, W)), int(rng.integers(120, 300))
        ov = Image.new('RGBA', (W, W), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        od.ellipse([x - r, y - r, x + r, y + r], fill=[(150, 60, 200, 70), (255, 190, 90, 60), (80, 30, 140, 80)][i % 3]); im.paste(ov, (0, 0), ov)
    im = im.filter(ImageFilter.GaussianBlur(14 * S))
    mask = Image.new('L', (W, W), 0); md = ImageDraw.Draw(mask)
    prof = [(380, 600), (375, 470), (355, 440), (372, 410), (362, 380), (380, 355), (372, 330), (360, 310), (345, 245), (370, 170), (330, 115), (260, 100), (205, 140), (190, 210), (215, 270), (205, 330), (160, 420), (120, 600)]
    md.polygon([(x * S, y * S) for x, y in prof], fill=255)
    g = grad((255, 200, 100), (120, 40, 180)).filter(ImageFilter.GaussianBlur(10 * S))
    inner = Image.blend(g, Image.new('RGB', (W, W), (12, 6, 30)), 0.35)
    im.paste(inner, (0, 0), mask)
    d = ImageDraw.Draw(im)
    d.ellipse([400 * S, 90 * S, 440 * S, 130 * S], outline=(255, 225, 160), width=2 * S)
    text(d, (40, 480), 'velvet', font(SERI, 64), (255, 236, 200), 'lm'); text(d, (42, 540), 'hours', font(SERI, 64), (255, 236, 200), 'lm')
    text(d, (570, 40), 'AMARA LUNE', font(SB, 18), (255, 236, 200), 'ra')
    return grain(im, 14, 5)
def punk():
    im = Image.new('RGB', (W, W), (244, 220, 40)); d = ImageDraw.Draw(im); rng = random.Random(11)
    for i in range(10):
        x, y = rng.randint(-50, 500) * S, rng.randint(-50, 500) * S; w, h = rng.randint(150, 320) * S, rng.randint(100, 260) * S
        c = [(15, 15, 15), (225, 30, 40), (245, 240, 225), (15, 15, 15)][i % 4]
        d.polygon([(x + rng.randint(0, 20) * S, y + rng.randint(0, 20) * S), (x + w, y + rng.randint(0, 30) * S), (x + w - rng.randint(0, 20) * S, y + h), (x + rng.randint(0, 30) * S, y + h - rng.randint(0, 20) * S)], fill=c)
    for cx, cy, col in [(130, 190, (15, 15, 15)), (450, 380, (225, 30, 40))]:
        for gx in range(-90, 91, 12):
            for gy in range(-90, 91, 12):
                rr = max(0, (90 - math.hypot(gx, gy)) / 90) * 6
                if rr > 0.5: d.ellipse([(cx + gx - rr) * S, (cy + gy - rr) * S, (cx + gx + rr) * S, (cy + gy + rr) * S], fill=col)
    d.rectangle([20 * S, 400 * S, 580 * S, 530 * S], fill=(245, 240, 225))
    text(d, (300, 465), 'LOUD + BROKE', font(SB, 70), (15, 15, 15), 'mm')
    d.rectangle([20 * S, 540 * S, 300 * S, 580 * S], fill=(15, 15, 15)); text(d, (160, 560), 'DEAD CHAIRS', font(SB, 26), (244, 220, 40), 'mm')
    d.line([(20 * S, 400 * S), (580 * S, 400 * S)], fill=(15, 15, 15), width=5 * S); d.line([(20 * S, 530 * S), (580 * S, 530 * S)], fill=(15, 15, 15), width=5 * S)
    return grain(im, 22, 6)
def chrome():
    yy, xx = np.mgrid[0:W, 0:W]
    dx, dy = (xx - 300 * S) / S, (yy - 290 * S) / S
    r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
    rad = 150 + 38 * np.sin(3 * th + 1) + 22 * np.sin(5 * th - 2)
    inside = r < rad; t = np.clip(r / rad, 0, 1)
    v = 0.5 + 0.5 * np.sin(t * 9 + np.sin(th * 2) * 3)
    R = np.where(inside, 40 + 200 * v, 5); G = np.where(inside, 120 + 130 * (1 - v) + 60 * np.sin(t * 5), 6); B = np.where(inside, 200 + 55 * v, 10)
    spec = np.exp(-(((dx + 50) ** 2 + (dy + 60) ** 2) / 900)) * 255 * inside
    a = np.stack([R + spec, G + spec, B + spec], -1)
    glow = np.exp(-np.clip(r - rad, 0, None) / 30) * (~inside) * 60
    a[..., 2] += glow; a[..., 1] += glow * .6
    im = Image.fromarray(a.clip(0, 255).astype('uint8')); d = ImageDraw.Draw(im)
    d.rectangle([24 * S, 24 * S, 576 * S, 576 * S], outline=(200, 230, 255), width=2 * S)
    text(d, (40, 545), 'AURORA//09', font(MONO, 34), (210, 235, 255), 'lm'); text(d, (560, 545), 'SYNTH_LAB', font(MONO, 16), (120, 200, 255), 'rm')
    text(d, (40, 50), 'LIQUID STATE', font(MONO, 16), (120, 200, 255))
    return grain(im, 8, 7)
def jazz():
    im = Image.new('RGB', (W, W), (20, 40, 90)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 150 * S], fill=(238, 226, 196))
    d.ellipse([360 * S, 80 * S, 540 * S, 260 * S], fill=(238, 226, 196))
    d.polygon([(60 * S, 600 * S), (60 * S, 230 * S), (200 * S, 330 * S), (200 * S, 600 * S)], fill=(200, 45, 40))
    d.pieslice([140 * S, 200 * S, 420 * S, 480 * S], 180, 360, fill=(10, 20, 50))
    d.rectangle([140 * S, 340 * S, 420 * S, 380 * S], fill=(238, 226, 196))
    d.polygon([(420 * S, 600 * S), (520 * S, 600 * S), (520 * S, 420 * S)], fill=(10, 20, 50))
    d.ellipse([430 * S, 300 * S, 470 * S, 340 * S], fill=(200, 45, 40))
    for i in range(5): d.rectangle([(230 + i * 28) * S, 400 * S, (244 + i * 28) * S, 600 * S], fill=(238, 226, 196))
    text(d, (30, 60), 'BLUE ROOM', font(SB, 50), (20, 40, 90), 'lm'); text(d, (30, 112), 'sessions', font(SERI, 34), (200, 45, 40), 'lm')
    text(d, (570, 575), 'THE ELIAS QUARTET', font(SB, 18), (238, 226, 196), 'rm')
    return grain(im, 10, 8)
def pop():
    im = grad((255, 196, 224), (255, 120, 190)); d = ImageDraw.Draw(im); rng = random.Random(2)
    for _ in range(30):
        x, y = rng.randint(0, 600), rng.randint(0, 600); r = rng.randint(3, 9)
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=(255, 255, 255))
    def star(cx, cy, R, fill):
        pts = [(cx + (R if i % 2 == 0 else R * .45) * math.cos(math.pi / 5 * i - math.pi / 2), cy + (R if i % 2 == 0 else R * .45) * math.sin(math.pi / 5 * i - math.pi / 2)) for i in range(10)]
        d.polygon([(x * S, y * S) for x, y in pts], fill=fill)
    star(110, 140, 60, (255, 240, 120)); star(500, 120, 40, (140, 230, 255)); star(480, 430, 50, (255, 240, 120))
    heart = Image.new('L', (W, W), 0); hd = ImageDraw.Draw(heart)
    hd.ellipse([120 * S, 130 * S, 310 * S, 320 * S], fill=255); hd.ellipse([290 * S, 130 * S, 480 * S, 320 * S], fill=255)
    hd.polygon([(125 * S, 260 * S), (475 * S, 260 * S), (300 * S, 500 * S)], fill=255)
    im.paste(Image.new('RGB', (W, W), (120, 20, 80)), (40, 36), heart); im.paste(grad((255, 70, 120), (190, 10, 70)), (0, 0), heart)
    d = ImageDraw.Draw(im)
    d.ellipse([160 * S, 160 * S, 240 * S, 210 * S], fill=(255, 190, 210)); d.ellipse([175 * S, 170 * S, 215 * S, 190 * S], fill=(255, 255, 255))
    text(d, (300, 556), 'sugar rush', font(SB, 56), (255, 255, 255), 'mm'); text(d, (300, 36), 'MIMI KAI', font(SB, 22), (150, 20, 80), 'mm')
    return grain(im, 5, 9)

gens = {'golden-hour': sunrise, 'no-mercy': crown, 'neon-drive': synth, 'quiet-pines': folk, 'velvet-hours': violet, 'loud-and-broke': punk, 'liquid-state': chrome, 'blue-room': jazz, 'sugar-rush': pop}
for n, f in gens.items():
    save(f(), n); print(n)
