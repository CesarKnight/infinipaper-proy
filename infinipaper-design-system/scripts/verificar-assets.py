#!/usr/bin/env python3
"""Verifica el sistema de diseño: assets, tokens y contraste WCAG.

Salida 0 si todo está bien; 1 si hay errores.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []
CHECKS = 0


def ok(message: str) -> None:
    global CHECKS
    CHECKS += 1
    print(f"  ok  {message}")


def fail(message: str) -> None:
    ERRORS.append(message)
    print(f" FAIL {message}")


def require(path: Path) -> None:
    if path.exists():
        ok(str(path.relative_to(ROOT)))
    else:
        fail(f"Falta {path.relative_to(ROOT)}")


def size_of(path: Path) -> tuple[int, int]:
    with Image.open(path) as im:
        return im.size


def expect_size(path: Path, width: int, height: int) -> None:
    if not path.exists():
        fail(f"Falta {path.relative_to(ROOT)}")
        return
    got = size_of(path)
    if got == (width, height):
        ok(f"{path.relative_to(ROOT)} {width}x{height}")
    else:
        fail(f"{path.relative_to(ROOT)}: esperado {width}x{height}, obtenido {got[0]}x{got[1]}")


def is_opaque(path: Path) -> None:
    if not path.exists():
        fail(f"Falta {path.relative_to(ROOT)}")
        return
    with Image.open(path) as im:
        if im.mode in ("RGB", "L"):
            ok(f"{path.relative_to(ROOT)} opaco")
            return
        if "A" in im.mode:
            lo, hi = im.getchannel("A").getextrema()
            if lo == hi == 255:
                ok(f"{path.relative_to(ROOT)} opaco")
            else:
                fail(f"{path.relative_to(ROOT)} debe ser opaco (alpha {lo}-{hi})")
        else:
            ok(f"{path.relative_to(ROOT)} sin canal alfa")


def has_alpha(path: Path) -> None:
    if not path.exists():
        fail(f"Falta {path.relative_to(ROOT)}")
        return
    with Image.open(path) as im:
        if "A" not in im.mode:
            fail(f"{path.relative_to(ROOT)} debe tener transparencia")
            return
        lo, _ = im.getchannel("A").getextrema()
        if lo == 0:
            ok(f"{path.relative_to(ROOT)} con transparencia")
        else:
            fail(f"{path.relative_to(ROOT)} no tiene píxeles transparentes")


def lum(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a: str, b: str) -> float:
    l1, l2 = sorted((lum(a), lum(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def extract_block(css: str, selector: str) -> str:
    idx = 0
    while True:
        idx = css.find(selector, idx)
        if idx < 0:
            fail(f"No se encontró el selector {selector} en el CSS")
            return ""
        after = css[idx + len(selector):].lstrip()
        if after.startswith("{") or after.startswith(","):
            break
        idx += len(selector)
    start = css.find("{", idx)
    depth = 0
    for i in range(start, len(css)):
        if css[i] == "{":
            depth += 1
        elif css[i] == "}":
            depth -= 1
            if depth == 0:
                return css[start + 1:i]
    fail(f"Bloque sin cerrar para {selector}")
    return ""


def css_vars(block: str) -> dict[str, str]:
    return {
        name.strip(): value.strip()
        for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", block)
    }


def hex_norm(value: str) -> str:
    value = value.strip()
    if re.fullmatch(r"#[0-9a-fA-F]{3,8}", value):
        return value.upper()
    return value


def check_tokens() -> None:
    print("\nTokens")
    tokens_path = ROOT / "tokens" / "design-tokens.json"
    css_path = ROOT / "tokens" / "tokens.css"
    ts_path = ROOT / "tokens" / "tokens.ts"
    tw_path = ROOT / "tokens" / "tailwind.css"
    for path in (tokens_path, css_path, ts_path, tw_path):
        require(path)
    try:
        data = json.loads(tokens_path.read_text(encoding="utf-8"))
        ok("design-tokens.json es JSON válido")
    except json.JSONDecodeError as exc:
        fail(f"design-tokens.json inválido: {exc}")
        return

    css = css_path.read_text(encoding="utf-8")
    light_vars = css_vars(extract_block(css, ":root"))
    dark_vars = css_vars(extract_block(css, ".dark"))
    semantic = data["color"]["semantic"]
    for mode, variables in (("light", light_vars), ("dark", dark_vars)):
        before = len(ERRORS)
        for key, entry in semantic[mode].items():
            css_name = f"--{key}"
            expected = hex_norm(entry["value"])
            got = hex_norm(variables.get(css_name, ""))
            if got == expected:
                continue
            fail(f"{mode}.{key}: JSON {expected} != CSS {got or 'ausente'}")
        if len(ERRORS) == before:
            ok(f"tokens {mode} coinciden con tokens.css")

    # Tipografía, radios y espaciado básicos.
    checks = {
        "--ds-font-sans": "Inter",
        "--ds-font-heading": "Fraunces",
        "--ds-font-mono": "Geist Mono",
        "--ds-text-display": "4rem",
        "--ds-text-heading": "1.875rem",
        "--ds-text-body": "1rem",
        "--ds-text-label": "0.75rem",
        "--ds-radius-md": "0.75rem",
        "--ds-radius-lg": "1rem",
        "--ds-radius-xl": "1.25rem",
        "--ds-radius-2xl": "1.375rem",
        "--ds-space-6": "1.5rem",
        "--ds-space-16": "4rem",
        "--ds-touch-target": "2.75rem",
    }
    for name, fragment in checks.items():
        value = light_vars.get(name, "")
        if fragment in value:
            ok(f"{name} contiene {fragment}")
        else:
            fail(f"{name}: se esperaba {fragment}, obtenido {value!r}")

    # Contraste AA de los pares principales.
    print("\nContraste WCAG AA")
    pairs = {
        "light": [
            ("foreground", "background"),
            ("muted-foreground", "background"),
            ("muted-foreground", "muted"),
            ("primary-foreground", "primary"),
            ("secondary-foreground", "secondary"),
            ("accent-foreground", "accent"),
            ("destructive-foreground", "destructive"),
            ("success-foreground", "success"),
            ("warning-foreground", "warning"),
        ],
        "dark": [
            ("foreground", "background"),
            ("muted-foreground", "background"),
            ("muted-foreground", "muted"),
            ("primary-foreground", "primary"),
            ("secondary-foreground", "secondary"),
            ("accent-foreground", "accent"),
            ("destructive-foreground", "destructive"),
            ("success-foreground", "success"),
            ("warning-foreground", "warning"),
        ],
    }
    for mode, variables in (("light", light_vars), ("dark", dark_vars)):
        for fg, bg in pairs[mode]:
            fg_value = variables.get(f"--{fg}", "")
            bg_value = variables.get(f"--{bg}", "")
            if not fg_value or not bg_value:
                fail(f"Contraste {mode} {fg}/{bg}: token ausente")
                continue
            ratio = contrast(fg_value, bg_value)
            if ratio >= 4.5:
                ok(f"{mode} {fg}/{bg}: {ratio:.2f}:1")
            else:
                fail(f"{mode} {fg}/{bg}: {ratio:.2f}:1 < 4.5:1")

    # Sincronía básica con TypeScript.
    ts = ts_path.read_text(encoding="utf-8")
    for fragment in ('background: "#FAF6EE"', 'background: "#0C052C"',
                     'primary: "#4B2EA3"', 'primary: "#A98BFF"'):
        if fragment in ts:
            ok(f"tokens.ts contiene {fragment}")
        else:
            fail(f"tokens.ts no contiene {fragment}")

    # Si el frontend está al lado, comprueba que su copia sigue sincronizada.
    frontend = ROOT.parent / "infinipaper-frontend" / "app" / "globals.css"
    if frontend.exists():
        print("\nSincronía con el frontend")
        fcss = frontend.read_text(encoding="utf-8")
        flight = css_vars(extract_block(fcss, ":root"))
        fdark = css_vars(extract_block(fcss, ".dark"))
        for mode, variables in (("light", flight), ("dark", fdark)):
            before = len(ERRORS)
            for key, entry in semantic[mode].items():
                expected = hex_norm(entry["value"])
                got = hex_norm(variables.get(f"--{key}", ""))
                if got != expected:
                    fail(f"frontend {mode}.{key}: {expected} != {got or 'ausente'}")
            if len(ERRORS) == before:
                ok(f"frontend {mode} coincide con tokens")
        for fragment in ("--font-sans: var(--font-inter)",
                         "--font-heading: var(--font-fraunces)",
                         "--font-mono: var(--font-geist-mono)"):
            if fragment in fcss:
                ok(f"frontend contiene {fragment}")
            else:
                fail(f"frontend no contiene {fragment}")
    else:
        print("\nSincronía con el frontend: omitida (no está al lado)")


def check_svgs() -> None:
    print("\nSVG autocontenidos")
    allowed = {"http://www.w3.org/2000/svg",
               "http://www.w3.org/1999/xlink"}
    for path in sorted(ROOT.rglob("*.svg")):
        text = path.read_text(encoding="utf-8")
        bad = False
        for match in re.findall(r"https?://[^\s\"')]+", text):
            if match in allowed:
                continue
            bad = True
            fail(f"{path.relative_to(ROOT)} referencia externa: {match}")
        if re.search(r"@import\s+url", text):
            bad = True
            fail(f"{path.relative_to(ROOT)} contiene @import")
        if 'href="http' in text or "url(http" in text:
            bad = True
            fail(f"{path.relative_to(ROOT)} contiene href/url externo")
        if not bad:
            ok(str(path.relative_to(ROOT)))


def check_assets() -> None:
    print("\nAssets")
    # Logos
    for name in ("mark-fade", "mark-indigo", "mark-ink", "mark-white",
                 "mark-mini-ink", "mark-mini-white", "wordmark",
                 "wordmark-ink", "wordmark-white",
                 "lockup-horizontal-light", "lockup-horizontal-dark",
                 "lockup-horizontal-ink", "lockup-horizontal-white",
                 "lockup-stacked-light", "lockup-stacked-dark"):
        require(ASSETS / "logos" / f"{name}.svg")

    # Android
    densities = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144,
                 "xxxhdpi": 192}
    adaptive = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324,
                "xxxhdpi": 432}
    for density, px in densities.items():
        expect_size(ASSETS / "app-icons/android/res" / f"mipmap-{density}" /
                    "ic_launcher.png", px, px)
        expect_size(ASSETS / "app-icons/android/res" / f"mipmap-{density}" /
                    "ic_launcher_round.png", px, px)
    for density, px in adaptive.items():
        for name in ("ic_launcher_background", "ic_launcher_foreground",
                     "ic_launcher_monochrome"):
            expect_size(ASSETS / "app-icons/android/res" / f"drawable-{density}" /
                        f"{name}.png", px, px)
    has_alpha(ASSETS / "app-icons/android/res/drawable-mdpi/ic_launcher_foreground.png")
    has_alpha(ASSETS / "app-icons/android/res/drawable-mdpi/ic_launcher_monochrome.png")
    expect_size(ASSETS / "app-icons/android/play-store-icon-512.png", 512, 512)
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        require(ASSETS / "app-icons/android/res/mipmap-anydpi-v26" / name)
        require(ASSETS / "app-icons/android/res/mipmap-anydpi-v33" / name)

    # iOS
    for name in ("AppIcon-1024-light", "AppIcon-1024-dark", "AppIcon-1024-tinted"):
        path = ASSETS / "app-icons/ios" / f"{name}.png"
        expect_size(path, 1024, 1024)
        is_opaque(path)
    for name in ("background-light-1024", "background-dark-1024",
                 "mark-light-1024", "mark-dark-1024", "mark-tinted-1024"):
        expect_size(ASSETS / "app-icons/ios/layers" / f"{name}.png", 1024, 1024)
    for name in ("mark-light-1024", "mark-dark-1024", "mark-tinted-1024"):
        has_alpha(ASSETS / "app-icons/ios/layers" / f"{name}.png")

    # Web
    for name in ("favicon.svg", "favicon.ico", "favicon-16.png",
                 "favicon-32.png", "favicon-48.png", "favicon-64.png",
                 "apple-touch-icon-180.png", "icon-192.png", "icon-512.png",
                 "maskable-512.png", "site.webmanifest", "og-image.png"):
        require(ASSETS / "web" / name)
    for name, px in (("favicon-16.png", 16), ("favicon-32.png", 32),
                     ("favicon-48.png", 48), ("favicon-64.png", 64),
                     ("apple-touch-icon-180.png", 180),
                     ("icon-192.png", 192), ("icon-512.png", 512),
                     ("maskable-512.png", 512)):
        expect_size(ASSETS / "web" / name, px, px)
    expect_size(ASSETS / "web/og-image.png", 1200, 630)
    is_opaque(ASSETS / "web/apple-touch-icon-180.png")
    is_opaque(ASSETS / "web/icon-192.png")
    is_opaque(ASSETS / "web/maskable-512.png")

    with Image.open(ASSETS / "web/favicon.ico") as ico:
        sizes = sorted(ico.info.get("sizes", []))
        if {(16, 16), (32, 32), (48, 48)}.issubset(set(sizes)):
            ok(f"favicon.ico contiene {sizes}")
        else:
            fail(f"favicon.ico no contiene 16/32/48: {sizes}")

    try:
        manifest = json.loads((ASSETS / "web/site.webmanifest").read_text())
        icons = manifest.get("icons", [])
        if len(icons) >= 3:
            ok("site.webmanifest tiene iconos 192/512/maskable")
        else:
            fail("site.webmanifest no tiene los tres iconos esperados")
    except json.JSONDecodeError as exc:
        fail(f"site.webmanifest inválido: {exc}")

    # Notificaciones
    for name in ("status-bar-24dp.svg", "status-bar-24dp-24.png",
                 "status-bar-24dp-48.png", "status-bar-24dp-72.png",
                 "status-bar-24dp-96.png", "notification-192.png",
                 "badge-96.png", "notification-avatar-40.png"):
        require(ASSETS / "notifications" / name)
    for name, px in (("status-bar-24dp-24.png", 24),
                     ("status-bar-24dp-48.png", 48),
                     ("status-bar-24dp-72.png", 72),
                     ("status-bar-24dp-96.png", 96),
                     ("notification-192.png", 192),
                     ("badge-96.png", 96),
                     ("notification-avatar-40.png", 40)):
        expect_size(ASSETS / "notifications" / name, px, px)
    has_alpha(ASSETS / "notifications/status-bar-24dp-24.png")
    has_alpha(ASSETS / "notifications/badge-96.png")

    # Tamaño máximo.
    for path in sorted(ASSETS.rglob("*")):
        if path.is_file() and path.stat().st_size > 1_000_000:
            fail(f"{path.relative_to(ROOT)} supera 1 MB")


def main() -> int:
    print("Verificando Infinipaper Design System")
    check_tokens()
    check_svgs()
    check_assets()
    print(f"\n{CHECKS} comprobaciones correctas, {len(ERRORS)} errores.")
    if ERRORS:
        print("\nErrores:")
        for error in ERRORS:
            print(f" - {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
