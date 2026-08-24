"""素材写真をパレットに焼き込む（ブラウザ不要・決定論的）。

  python3 scripts/bake-photos.py

写真は Unsplash ライセンス（商用可・帰属表示不要）。出典は assets/source/CREDITS.md。
デュオトーンにするのは、元写真の色をそのまま出すと clay 1色という決めごとが崩れるため。
CSS の sepia フィルタでは灰色に寄ってしまうので、影とハイライトの2色を直接指定する。
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'assets' / 'source', ROOT / 'assets'

# (影の色, ハイライトの色) — theme.mjs のトークンと同じ系統に揃えている
TONE = {
    'light': ((0x6B, 0x5E, 0x4C), (0xFB, 0xF8, 0xF3)),
    'dark':  ((0x0F, 0x0E, 0x0D), (0x7A, 0x6B, 0x58)),
}

def duotone(img, shadow, highlight):
    grey = img.convert('L')
    bands = [grey.point([int(s + (h - s) * i / 255) for i in range(256)])
             for s, h in zip(shadow, highlight)]
    return Image.merge('RGB', bands)

def grain(img, strength=0.09):
    """紙や漆喰の肌。SVG 側の feTurbulence と同じ役割を写真にも通す。"""
    n = Image.effect_noise(img.size, 22).convert('L')
    return Image.blend(img, ImageChops.overlay(img, Image.merge('RGB', (n, n, n))), strength)

def band(src, w, h, focus=0.5):
    """中心を focus（0=上端, 1=下端）に置いて w:h に切り出す。"""
    im = Image.open(src).convert('RGB')
    target = w / h
    if im.width / im.height > target:          # 横に長い → 幅を削る
        nw = int(im.height * target)
        left = (im.width - nw) // 2
        im = im.crop((left, 0, left + nw, im.height))
    else:                                      # 縦に長い → 高さを削る
        nh = int(im.width / target)
        top = int((im.height - nh) * focus)
        im = im.crop((0, top, im.width, top + nh))
    return im.resize((w, h), Image.LANCZOS)

JOBS = [
    # (元, 出力名, 幅, 高さ, focus, 画質)
    ('hero.jpg', 'photo-hero', 1200, 340, 0.42, 74),
    ('band.jpg', 'photo-band', 1200, 180, 0.50, 76),
]

for src, stem, w, h, focus, q in JOBS:
    base = band(SRC / src, w, h, focus)
    for theme, (shadow, highlight) in TONE.items():
        img = grain(duotone(base, shadow, highlight))
        path = OUT / f'{stem}-{theme}.jpg'
        img.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
        print(f'{path.name:<24} {w}x{h}  {path.stat().st_size // 1024} KB')
