#!/usr/bin/env python3
"""Genera las fuentes SVG y los PNG del sistema de diseño Infinipaper.

Uso:
    python3 scripts/generar-assets.py

Requiere `rsvg-convert` para rasterizar, Pillow para el .ico y `fontTools`
para convertir el wordmark a trazados.
Los SVG se escriben en `assets/` y los PNG junto a ellos.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ASSETS / "fonts"

FRAUNCES = FONTS / "Fraunces-SemiBold.ttf"
INTER_500 = FONTS / "Inter-Medium.ttf"

# ---------------------------------------------------------------------------
# Paleta del brand board v2
# ---------------------------------------------------------------------------
C = {
    "paper": "#FAF6EE",
    "paper_raised": "#FFFFFF",
    "paper_sunken": "#F3ECDD",
    "ink": "#1B1633",
    "muted": "#5B5575",
    "border": "#E6DECF",
    "indigo": "#4B2EA3",
    "indigo_soft": "#E9E2FA",
    "coral": "#FF6B57",
    "fade_1": "#4B2EA3",
    "fade_2": "#A1349F",
    "fade_3": "#F0504F",
    "icon_top": "#FDFAF3",
    "icon_bottom": "#F3ECDD",
    "night": "#0C052C",
    "surface": "#291054",
    "surface_2": "#3B2A6E",
    "white": "#FFFFFF",
    "secondary": "#C9B6E6",
    "violet": "#A98BFF",
    "amber": "#FFB84D",
    "icon_dark_1": "#4A3470",
    "icon_dark_2": "#291054",
    "icon_dark_3": "#1E0B46",
    "icon_dark_4": "#0F0630",
    "ios_tinted_bg": "#2C2C2E",
    "ios_tinted_fg": "#E5E5EA",
}

# ---------------------------------------------------------------------------
# Geometría del ratón (tomada del brand board v2)
# ---------------------------------------------------------------------------
P_PRIMARY = (
    "m 20.953931,79.699774 c -10.476966,1.169303 -4.373199,-6.863818 "
    "-4.373199,-6.863818 13.189751,-19.363677 29.9108,-22.41556 "
    "29.9108,-22.41556 14.382521,-1.83344 23.901732,3.31587 "
    "30.384024,12.311703 4.960938,8.069792 6.103633,17.449266 "
    "3.102094,16.941081 z"
)
P_EAR = (
    "m 67.838446,31.65673 c 0,0 4.70339,-0.219712 5.950925,-4.902722 "
    "1.330292,-4.993662 -1.141676,-7.131409 -3.957846,-8.585153 "
    "-11.425308,-5.897895 -19.763223,2.783311 -23.08235,14.870327 "
    "-2.868021,10.444261 -10.49576,12.322861 -13.28033,12.091395 "
    "-4.607057,-0.382961 -8.998899,-0.260499 -10.176306,-7.058032 "
    "-1.43191,-8.26685 8.655842,-9.438578 14.278237,-9.24014 "
    "7.672917,-0.132292 38.241557,3.451259 46.660625,16.755785 "
    "3.116106,4.924334 -1.812342,14.986641 -6.870241,16.992969"
)
P_SPIRAL_OUTER = (
    "m 25.820027,61.258048 a 6.7820001,6.5013309 0 0 1 -0.831836,-6.577917 "
    "6.7820001,6.5013309 0 0 1 5.617556,-3.860804 6.7820001,6.5013309 0 0 1 "
    "6.231752,2.866692"
)
P_SPIRAL_MID = (
    "m 33.946392,62.570702 a 7.6238871,7.417068 0 0 1 3.756023,-8.45354 "
    "7.6238871,7.417068 0 0 1 9.318716,1.619907 7.6238871,7.417068 0 0 1 "
    "0.51447,9.195896 7.6238871,7.417068 0 0 1 -9.08295,2.594301"
)
P_SPIRAL_INNER = (
    "m 33.799382,60.499209 a 4.165,4.3557534 0 0 1 4.549961,-1.141827 "
    "4.165,4.3557534 0 0 1 2.693468,4.001389 4.165,4.3557534 0 0 1 "
    "-2.562498,4.094385"
)
EYE = '<circle cx="27.78" cy="70.38" r="{r}" fill="{color}"/>'

FADE_DEF = (
    '<linearGradient id="fade" gradientUnits="userSpaceOnUse" '
    'x1="15" y1="80" x2="88" y2="14">'
    f'<stop offset="0" stop-color="{C["fade_1"]}"/>'
    f'<stop offset=".55" stop-color="{C["fade_2"]}"/>'
    f'<stop offset="1" stop-color="{C["fade_3"]}"/>'
    "</linearGradient>"
)
PAPER_DEF = (
    '<linearGradient id="paper" gradientUnits="userSpaceOnUse" '
    'x1="0" y1="0" x2="0" y2="108">'
    f'<stop offset="0" stop-color="{C["icon_top"]}"/>'
    f'<stop offset="1" stop-color="{C["icon_bottom"]}"/>'
    "</linearGradient>"
)
NIGHT_DEF = (
    '<linearGradient id="night" gradientUnits="userSpaceOnUse" '
    'x1="0" y1="0" x2="0" y2="100">'
    f'<stop offset="0" stop-color="{C["icon_dark_1"]}"/>'
    f'<stop offset=".14" stop-color="{C["icon_dark_2"]}"/>'
    f'<stop offset=".55" stop-color="{C["icon_dark_3"]}"/>'
    f'<stop offset="1" stop-color="{C["icon_dark_4"]}"/>'
    "</linearGradient>"
)


def mark_body(stroke: str, eye: str, width: float = 4, mini: bool = False) -> str:
    paths = [P_PRIMARY, P_EAR]
    if mini:
        paths = [P_PRIMARY, P_EAR, P_SPIRAL_MID]
    else:
        paths += [P_SPIRAL_OUTER, P_SPIRAL_MID, P_SPIRAL_INNER]
    path_xml = "".join(f'<path d="{d}"/>' for d in paths)
    radius = 4 if mini else 2.6
    return (
        f'<g fill="none" stroke="{stroke}" stroke-width="{width}" '
        'stroke-linecap="round" stroke-linejoin="round">'
        f"{path_xml}</g>{EYE.format(r=radius, color=eye)}"
    )


def svg(viewbox: str, body: str, width: int | None = None,
        height: int | None = None, defs: str = "", extra: str = "") -> str:
    size = ""
    if width:
        size += f' width="{width}"'
    if height:
        size += f' height="{height}"'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"'
        f'{size}{extra}>{f"<defs>{defs}</defs>" if defs else ""}{body}</svg>\n'
    )


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def render(svg_path: Path, png_path: Path, size: int | tuple[int, int],
           background: str | None = None) -> None:
    png_path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(size, tuple):
        w, h = size
    else:
        w = h = size
    cmd = ["rsvg-convert", "-w", str(w), "-h", str(h), "-o", str(png_path),
           str(svg_path)]
    if background:
        cmd.extend(["-b", background])
    subprocess.run(cmd, check=True)


# ---------------------------------------------------------------------------
# Texto a trazados (para wordmark y Open Graph)
# ---------------------------------------------------------------------------
def text_group(text: str, font_path: Path, size_px: float,
               color: str, letter_spacing_em: float = 0.0,
               x: float = 0, y: float = 0) -> dict:
    font = TTFont(font_path)
    cmap = font.getBestCmap()
    glyphset = font.getGlyphSet()
    upem = font["head"].unitsPerEm
    spacing = letter_spacing_em * upem
    cursor = 0.0
    paths: list[tuple[float, str]] = []
    bounds = None
    for ch in text:
        if ch == " ":
            cursor += font["hmtx"][cmap[ord(" ")]][0] + spacing
            continue
        gname = cmap[ord(ch)]
        pen = SVGPathPen(glyphset)
        glyphset[gname].draw(pen)
        d = pen.getCommands()
        if d:
            paths.append((cursor, d))
        bp = BoundsPen(glyphset)
        glyphset[gname].draw(bp)
        if bp.bounds:
            if bounds is None:
                bounds = bp.bounds
            else:
                bounds = (min(bounds[0], bp.bounds[0]),
                          min(bounds[1], bp.bounds[1]),
                          max(bounds[2], bp.bounds[2]),
                          max(bounds[3], bp.bounds[3]))
        cursor += font["hmtx"][gname][0] + spacing
    if bounds is None:
        raise ValueError(f"Sin contornos para: {text!r}")
    scale = size_px / upem
    top = bounds[3] * scale
    width = (cursor - spacing) * scale
    height = (bounds[3] - bounds[1]) * scale
    body = "".join(
        f'<path transform="translate({ox} 0)" d="{d}"/>'
        for ox, d in paths
    )
    group = (
        f'<g fill="{color}" transform="translate({x} {y + top}) '
        f'scale({scale} {-scale})">{body}</g>'
    )
    return {"group": group, "width": width, "height": height, "top": top}


def wordmark_group(color: str, size_px: float = 64, x: float = 0,
                   y: float = 0) -> dict:
    t = text_group("infinipaper", FRAUNCES, size_px, color, -0.01, x)
    # Desplaza el grupo completo a la posición vertical indicada.
    t["group"] = t["group"].replace(
        f'transform="translate({x} {t["top"]})',
        f'transform="translate({x} {y + t["top"]})',
        1,
    )
    return t


# ---------------------------------------------------------------------------
# Logos
# ---------------------------------------------------------------------------
def build_logos() -> None:
    logos = ASSETS / "logos"
    tight = "13 12 76 72"
    write(logos / "mark-fade.svg", svg(
        tight, mark_body("url(#fade)", C["indigo"]), 380, 360, FADE_DEF))
    write(logos / "mark-indigo.svg", svg(
        tight, mark_body(C["indigo"], C["indigo"]), 380, 360))
    write(logos / "mark-ink.svg", svg(
        tight, mark_body(C["ink"], C["ink"]), 380, 360))
    write(logos / "mark-white.svg", svg(
        tight, mark_body(C["white"], C["white"]), 380, 360))
    write(logos / "mark-mini-ink.svg", svg(
        tight, mark_body(C["ink"], C["ink"], 7, True), 380, 360))
    write(logos / "mark-mini-white.svg", svg(
        tight, mark_body(C["white"], C["white"], 7, True), 380, 360))

    for name, color in (("wordmark-ink", C["ink"]),
                        ("wordmark-white", C["white"])):
        wm = wordmark_group(color)
        write(logos / f"{name}.svg", svg(
            f"0 0 {wm['width']:.2f} {wm['height']:.2f}", wm["group"],
            round(wm["width"]), round(wm["height"]),
            extra=' role="img" aria-label="infinipaper"'))
    wm = wordmark_group("currentColor")
    write(logos / "wordmark.svg", svg(
        f"0 0 {wm['width']:.2f} {wm['height']:.2f}", wm["group"],
        round(wm["width"]), round(wm["height"]),
        extra=' role="img" aria-label="infinipaper"'))

    # Lockup horizontal: marca de 100 x 95 + 24 px + wordmark de 64 px.
    mark_h = 95.0
    mark_w = 100.0
    mark_scale = mark_w / 76.0
    gap = 24.0
    wm = wordmark_group(C["ink"], 64)
    total_w = mark_w + gap + wm["width"] + 6
    y = (mark_h - wm["height"]) / 2
    mark_light = (
        f'<g transform="translate({-13 * mark_scale} {-12 * mark_scale}) '
        f'scale({mark_scale})">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>'
    )
    base = (
        mark_light
        + f'{wordmark_group(C["ink"], 64, mark_w + gap, y)["group"]}'
    )
    write(logos / "lockup-horizontal-light.svg", svg(
        f"0 0 {total_w:.2f} {mark_h}", base,
        round(total_w), round(mark_h), FADE_DEF,
        extra=' role="img" aria-label="infinipaper"'))
    mark_dark = (
        f'<g transform="translate({-13 * mark_scale} {-12 * mark_scale}) '
        f'scale({mark_scale})">'
        f'{mark_body(C["white"], C["white"])}</g>'
    )
    dark_base = (
        mark_dark
        + f'{wordmark_group(C["white"], 64, mark_w + gap, y)["group"]}'
    )
    write(logos / "lockup-horizontal-dark.svg", svg(
        f"0 0 {total_w:.2f} {mark_h}", dark_base,
        round(total_w), round(mark_h),
        extra=' role="img" aria-label="infinipaper"'))

    for name, color in (("lockup-horizontal-ink", C["ink"]),
                        ("lockup-horizontal-white", C["white"])):
        mark_mono = (
            f'<g transform="translate({-13 * mark_scale} {-12 * mark_scale}) '
            f'scale({mark_scale})">'
            f'{mark_body(color, color)}</g>'
        )
        mono = (
            mark_mono
            + f'{wordmark_group(color, 64, mark_w + gap, y)["group"]}'
        )
        write(logos / f"{name}.svg", svg(
            f"0 0 {total_w:.2f} {mark_h}", mono,
            round(total_w), round(mark_h),
            extra=' role="img" aria-label="infinipaper"'))

    # Lockup vertical: marca de 150 px + 28 px + wordmark de 64 px.
    mw = 150.0
    mh = mw * 72 / 76
    gap_v = 28.0
    wm = wordmark_group(C["ink"], 64)
    total_w = max(mw, wm["width"]) + 6
    total_h = mh + gap_v + wm["height"] + 6
    scale = mw / 76
    light = (
        f'<g transform="translate({(total_w - mw) / 2 - 13 * scale} 0) '
        f'scale({scale})">{mark_body("url(#fade)", C["indigo"])}</g>'
        f'{wordmark_group(C["ink"], 64, (total_w - wm["width"]) / 2, mh + gap_v)["group"]}'
    )
    write(logos / "lockup-stacked-light.svg", svg(
        f"0 0 {total_w:.2f} {total_h:.2f}", light,
        round(total_w), round(total_h), FADE_DEF,
        extra=' role="img" aria-label="infinipaper"'))
    dark = (
        f'<g transform="translate({(total_w - mw) / 2 - 13 * scale} 0) '
        f'scale({scale})">{mark_body(C["white"], C["white"])}</g>'
        f'{wordmark_group(C["white"], 64, (total_w - wm["width"]) / 2, mh + gap_v)["group"]}'
    )
    write(logos / "lockup-stacked-dark.svg", svg(
        f"0 0 {total_w:.2f} {total_h:.2f}", dark,
        round(total_w), round(total_h),
        extra=' role="img" aria-label="infinipaper"'))


# ---------------------------------------------------------------------------
# Iconos Android
# ---------------------------------------------------------------------------
def android_mark(x: float = 20.7, y: float = 22.9, scale: float = 0.66,
                 mini: bool = False, stroke: str = "url(#fade)",
                 eye: str = C["indigo"]) -> str:
    return (
        f'<g transform="translate({x} {y}) scale({scale})">'
        f'{mark_body(stroke, eye, 4, mini)}</g>'
    )


def build_android() -> None:
    android = ASSETS / "app-icons" / "android"
    src = android / "src"
    res = android / "res"

    write(src / "ic_launcher_background.svg", svg(
        "0 0 108 108",
        f'<rect width="108" height="108" fill="url(#paper)"/>',
        108, 108, PAPER_DEF))
    write(src / "ic_launcher_foreground.svg", svg(
        "0 0 108 108", android_mark(), 108, 108, FADE_DEF))
    write(src / "ic_launcher_monochrome.svg", svg(
        "0 0 108 108", android_mark(stroke=C["ink"], eye=C["ink"]), 108, 108))
    write(src / "guia-zona-segura.svg", svg(
        "0 0 108 108",
        android_mark()
        + '<rect x="18" y="18" width="72" height="72" fill="none" '
          f'stroke="{C["coral"]}" stroke-width="0.6" stroke-dasharray="2 1.5"/>'
        + '<circle cx="54" cy="54" r="33" fill="none" '
          f'stroke="{C["indigo"]}" stroke-width="0.6" stroke-dasharray="2 1.5"/>',
        108, 108, FADE_DEF))

    ios_like = (
        f'<rect width="100" height="100" fill="url(#paper)"/>'
        f'<g transform="translate(-0.5 2.8)">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>'
    )
    write(src / "ic_launcher_legacy.svg", svg(
        "0 0 100 100", ios_like, 512, 512, PAPER_DEF + FADE_DEF))
    write(src / "ic_launcher_round.svg", svg(
        "0 0 100 100",
        '<defs><clipPath id="round"><circle cx="50" cy="50" r="50"/></clipPath></defs>'
        f'<g clip-path="url(#round)">{ios_like}</g>',
        512, 512, PAPER_DEF + FADE_DEF))
    write(src / "ic_launcher_playstore.svg", svg(
        "0 0 100 100", ios_like, 512, 512, PAPER_DEF + FADE_DEF))

    # Densidades legacy.
    densities = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for d, px in densities.items():
        folder = res / f"mipmap-{d}"
        render(src / "ic_launcher_legacy.svg", folder / "ic_launcher.png", px)
        render(src / "ic_launcher_round.svg",
               folder / "ic_launcher_round.png", px)

    # Capas adaptive: 108 dp escaladas por densidad.
    adaptive = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }
    for d, px in adaptive.items():
        folder = res / f"drawable-{d}"
        for name in ("ic_launcher_background", "ic_launcher_foreground",
                     "ic_launcher_monochrome"):
            render(src / f"{name}.svg", folder / f"{name}.png", px)

    render(src / "ic_launcher_playstore.svg",
           android / "play-store-icon-512.png", 512)
    render(src / "guia-zona-segura.svg",
           android / "guia-zona-segura-512.png", 512)

    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
"""
    adaptive_xml_v33 = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
"""
    anydpi = res / "mipmap-anydpi-v26"
    write(anydpi / "ic_launcher.xml", adaptive_xml)
    write(anydpi / "ic_launcher_round.xml", adaptive_xml)
    anydpi33 = res / "mipmap-anydpi-v33"
    write(anydpi33 / "ic_launcher.xml", adaptive_xml_v33)
    write(anydpi33 / "ic_launcher_round.xml", adaptive_xml_v33)


# ---------------------------------------------------------------------------
# Iconos iOS
# ---------------------------------------------------------------------------
def build_ios() -> None:
    ios = ASSETS / "app-icons" / "ios"
    src = ios / "src"
    layers = ios / "layers"

    light = (
        f'<rect width="100" height="100" fill="url(#paper)"/>'
        f'<g transform="translate(-0.5 2.8)">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>'
    )
    dark = (
        f'<rect width="100" height="100" fill="url(#night)"/>'
        f'<g transform="translate(-0.5 2.8)">'
        f'{mark_body(C["white"], C["white"])}</g>'
    )
    tinted = (
        f'<rect width="100" height="100" fill="{C["ios_tinted_bg"]}"/>'
        f'<g transform="translate(-0.5 2.8)">'
        f'{mark_body(C["ios_tinted_fg"], C["white"])}</g>'
    )
    write(src / "AppIcon-light.svg", svg(
        "0 0 100 100", light, 1024, 1024, PAPER_DEF + FADE_DEF))
    write(src / "AppIcon-dark.svg", svg(
        "0 0 100 100", dark, 1024, 1024, NIGHT_DEF))
    write(src / "AppIcon-tinted.svg", svg(
        "0 0 100 100", tinted, 1024, 1024))

    # Capas para Icon Composer / iOS 26.
    write(src / "background-light.svg", svg(
        "0 0 100 100", '<rect width="100" height="100" fill="url(#paper)"/>',
        1024, 1024, PAPER_DEF))
    write(src / "background-dark.svg", svg(
        "0 0 100 100", '<rect width="100" height="100" fill="url(#night)"/>',
        1024, 1024, NIGHT_DEF))
    for name, stroke, eye in (
        ("mark-light", "url(#fade)", C["indigo"]),
        ("mark-dark", C["white"], C["white"]),
        ("mark-tinted", C["ios_tinted_fg"], C["white"]),
    ):
        write(src / f"{name}.svg", svg(
            "0 0 100 100",
            f'<g transform="translate(-0.5 2.8)">{mark_body(stroke, eye)}</g>',
            1024, 1024, FADE_DEF if name == "mark-light" else ""))

    for name in ("AppIcon-light", "AppIcon-dark", "AppIcon-tinted"):
        render(src / f"{name}.svg", ios / f"{name.replace('AppIcon-', 'AppIcon-1024-')}.png", 1024)
    shutil.copyfile(ios / "AppIcon-1024-light.png", ios / "AppIcon-1024.png")
    for name in ("background-light", "background-dark", "mark-light",
                 "mark-dark", "mark-tinted"):
        render(src / f"{name}.svg", layers / f"{name}-1024.png", 1024)


# ---------------------------------------------------------------------------
# Web y notificaciones
# ---------------------------------------------------------------------------
def build_web() -> None:
    web = ASSETS / "web"
    favicon = svg(
        "0 0 100 100",
        f'<rect width="100" height="100" rx="22" fill="url(#night)"/>'
        f'<g transform="translate(-6.6 -2.9) scale(1.12)">'
        f'{mark_body(C["white"], C["white"], 7, True)}</g>',
        100, 100, NIGHT_DEF)
    write(web / "favicon.svg", favicon)
    for px in (16, 32, 48, 64, 256):
        render(web / "favicon.svg", web / f"favicon-{px}.png", px)
    img = Image.open(web / "favicon-256.png").convert("RGBA")
    img.save(web / "favicon.ico", format="ICO",
             sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    # Apple Touch: cuadrado opaco, sin esquinas; iOS aplica su máscara.
    apple = svg(
        "0 0 100 100",
        f'<rect width="100" height="100" fill="url(#night)"/>'
        f'<g transform="translate(12 12) scale(0.76)">'
        f'<g transform="translate(-6.6 -2.9) scale(1.12)">'
        f'{mark_body(C["white"], C["white"], 7, True)}</g></g>',
        180, 180, NIGHT_DEF)
    write(web / "apple-touch-icon.svg", apple)
    render(web / "apple-touch-icon.svg", web / "apple-touch-icon-180.png", 180)

    # PWA: icono completo claro y maskable con zona segura.
    pwa = svg(
        "0 0 100 100",
        f'<rect width="100" height="100" fill="url(#paper)"/>'
        f'<g transform="translate(-0.5 2.8)">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>',
        512, 512, PAPER_DEF + FADE_DEF)
    write(web / "pwa-icon.svg", pwa)
    for px in (192, 512):
        render(web / "pwa-icon.svg", web / f"icon-{px}.png", px)
    maskable = svg(
        "0 0 100 100",
        f'<rect width="100" height="100" fill="url(#paper)"/>'
        f'<g transform="translate(12.5 16.25) scale(0.75)">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>',
        512, 512, PAPER_DEF + FADE_DEF)
    write(web / "maskable-512.svg", maskable)
    render(web / "maskable-512.svg", web / "maskable-512.png", 512)

    # Open Graph 1200 x 630.
    wm = wordmark_group(C["ink"], 120, 390, 190)
    tagline = text_group(
        "Material de estudio, compactado.", INTER_500, 36, C["muted"], 0, 394,
        y=400)
    og = (
        f'<rect width="1200" height="630" fill="{C["paper"]}"/>'
        f'<rect x="0" y="0" width="1200" height="630" fill="url(#paperog)"/>'
        f'<defs><linearGradient id="paperog" gradientUnits="userSpaceOnUse" '
        f'x1="0" y1="0" x2="1200" y2="630">'
        f'<stop offset="0" stop-color="{C["paper"]}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{C["paper_sunken"]}" stop-opacity=".55"/>'
        f'</linearGradient></defs>'
        f'<g transform="translate(80 175) scale({250 / 72}) translate(-13 -12)">'
        f'{mark_body("url(#fade)", C["indigo"])}</g>'
        f'{wm["group"]}{tagline["group"]}'
        f'<rect x="80" y="530" width="1040" height="4" rx="2" fill="url(#line)"/>'
        f'<defs><linearGradient id="line" gradientUnits="userSpaceOnUse" '
        f'x1="80" y1="0" x2="1120" y2="0">'
        f'<stop offset="0" stop-color="{C["fade_1"]}"/>'
        f'<stop offset=".55" stop-color="{C["fade_2"]}"/>'
        f'<stop offset="1" stop-color="{C["fade_3"]}"/>'
        "</linearGradient></defs>"
    )
    write(web / "og-image.svg", svg(
        "0 0 1200 630", og, 1200, 630, FADE_DEF))
    render(web / "og-image.svg", web / "og-image.png", (1200, 630))

    manifest = {
        "name": "Infinipaper",
        "short_name": "Infinipaper",
        "description": "Material de estudio colaborativo, compactado por agentes.",
        "start_url": "/",
        "display": "standalone",
        "background_color": C["paper"],
        "theme_color": C["indigo"],
        "icons": [
            {"src": "/icons/icon-192.png", "sizes": "192x192",
             "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-512.png", "sizes": "512x512",
             "type": "image/png", "purpose": "any"},
            {"src": "/icons/maskable-512.png", "sizes": "512x512",
             "type": "image/png", "purpose": "maskable"},
        ],
    }
    import json
    (web / "site.webmanifest").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8")


def build_notifications() -> None:
    notif = ASSETS / "notifications"

    def mini_at(scale: float, tx: float, ty: float, color: str,
                width: float = 7) -> str:
        return (
            f'<g transform="translate({tx} {ty}) scale({scale})">'
            f'{mark_body(color, color, width, True)}</g>'
        )

    write(notif / "status-bar-24dp.svg", svg(
        "0 0 24 24", mini_at(0.2688, -1.584, -0.696, C["white"]), 24, 24))
    for px in (24, 48, 72, 96):
        render(notif / "status-bar-24dp.svg",
               notif / f"status-bar-24dp-{px}.png", px)
    write(notif / "badge-96.svg", svg(
        "0 0 96 96", mini_at(0.96, 0, 0, C["white"]), 96, 96))
    render(notif / "badge-96.svg", notif / "badge-96.png", 96)
    write(notif / "notification-avatar-40.svg", svg(
        "0 0 40 40",
        f'<circle cx="20" cy="20" r="20" fill="{C["indigo"]}"/>'
        + mini_at(0.448, -2.64, -1.16, C["white"]),
        40, 40))
    render(notif / "notification-avatar-40.svg",
           notif / "notification-avatar-40.png", 40)

    # Push: usa el icono completo claro.
    render(ASSETS / "web" / "pwa-icon.svg",
           notif / "notification-192.png", 192)


def main() -> int:
    if not shutil.which("rsvg-convert"):
        print("Falta rsvg-convert. Instala librsvg2-bin.", file=sys.stderr)
        return 1
    for path in ("docs", "tokens", "assets", "examples", "scripts"):
        (ROOT / path).mkdir(parents=True, exist_ok=True)
    build_logos()
    build_android()
    build_ios()
    build_web()
    build_notifications()
    print("Assets generados en", ROOT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
