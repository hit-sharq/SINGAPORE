"""Render the Singapore Club app icon (gold tile + spade) to PNG.

The spade is rasterised from the exact lucide-react path used by the app's
brand mark, so the favicon and the in-app logo are the same artwork. Paths are
flattened to polygons, supersampled 4x, and downscaled for clean edges.
"""

import math
import re
from PIL import Image, ImageDraw

TOKEN_RE = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?")
COMMANDS = set("MmLlHhVvCcSsQqTtAaZz")

S = 4
SIZE = 512
BIG = SIZE * S
TILE = 32.0          # icon viewBox
MARK_SCALE = 1.05    # spade scale inside the tile
# optical centring: spade is 20x19 units, scaled, inside a 32 tile
MARK_X, MARK_Y = 3.38, 2.87

# lucide-react "spade" (24x24), used by components/auth-shell.tsx
SPADE = (
    "M12 18v4 M2 14.499a5.5 5.5 0 0 0 9.591 3.675.6.6 0 0 1 .818.001"
    "A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02"
    "L5 8.999c-1.5 1.5-3 3.2-3 5.5"
)
INK = (23, 24, 21)
GOLD_TOP, GOLD_BOTTOM = (232, 201, 140), (213, 162, 79)


def cubic(p0, p1, p2, p3, steps=24):
    out = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        out.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return out


def arc(p0, rx, ry, phi, large, sweep, p1, steps=28):
    """Endpoint-parameterised elliptical arc, flattened to polylines."""
    if rx == 0 or ry == 0:
        return [p1]
    phi = math.radians(phi)
    dx2, dy2 = (p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2
    x1 = math.cos(phi) * dx2 + math.sin(phi) * dy2
    y1 = -math.sin(phi) * dx2 + math.cos(phi) * dy2
    rx, ry = abs(rx), abs(ry)
    lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
    if lam > 1:
        scale = math.sqrt(lam)
        rx, ry = rx * scale, ry * scale
    num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    den = rx * rx * y1 * y1 + ry * ry * x1 * x1
    co = math.sqrt(max(0, num / den)) if den else 0
    if large == sweep:
        co = -co
    cx1, cy1 = co * rx * y1 / ry, -co * ry * x1 / rx
    cx = math.cos(phi) * cx1 - math.sin(phi) * cy1 + (p0[0] + p1[0]) / 2
    cy = math.sin(phi) * cx1 + math.cos(phi) * cy1 + (p0[1] + p1[1]) / 2

    def angle(ux, uy, vx, vy):
        dot = ux * vx + uy * vy
        norm = math.hypot(ux, uy) * math.hypot(vx, vy) or 1
        a = math.acos(max(-1, min(1, dot / norm)))
        return -a if ux * vy - uy * vx < 0 else a

    theta1 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
    dtheta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
    if not sweep and dtheta > 0:
        dtheta -= 2 * math.pi
    elif sweep and dtheta < 0:
        dtheta += 2 * math.pi

    out = []
    for i in range(1, steps + 1):
        t = theta1 + dtheta * i / steps
        out.append((
            cx + rx * math.cos(t) * math.cos(phi) - ry * math.sin(t) * math.sin(phi),
            cy + rx * math.cos(t) * math.sin(phi) + ry * math.sin(t) * math.cos(phi),
        ))
    return out


def flatten(d, steps=28):
    """Flatten an SVG path (M/L/c/l/A/a/v/V/Z subset) to a list of polylines."""
    tokens = TOKEN_RE.findall(d)
    polys, cur, pos, start, cmd = [], [], (0.0, 0.0), (0.0, 0.0), None
    i = 0

    def take(n):
        nonlocal i
        vals = tokens[i:i + n]
        i += n
        return [float(v) if v[0].isdigit() or v[0] in "+-." else v for v in vals]

    while i < len(tokens):
        if tokens[i] in COMMANDS:
            cmd = tokens[i]
            i += 1
            if cmd in "Zz":
                cur.append(start)
                polys.append(cur)
                cur, pos = [], start
                continue
        if cmd is None:
            raise ValueError("path must start with a command")

        if cmd in "Mm":
            x, y = take(2)
            pos = (pos[0] + x, pos[1] + y) if cmd == "m" else (x, y)
            start = pos
            cur = [pos]
            cmd = "L" if cmd == "M" else "l"          # implicit repeat
        elif cmd in "Ll":
            x, y = take(2)
            pos = (pos[0] + x, pos[1] + y) if cmd == "l" else (x, y)
            cur.append(pos)
        elif cmd in "Vv":
            y = take(1)[0]
            pos = (pos[0], pos[1] + y) if cmd == "v" else (pos[0], y)
            cur.append(pos)
        elif cmd in "Cc":
            v = take(6)
            pts = [(pos[0] + v[i], pos[1] + v[i + 1]) for i in (0, 2, 4)] if cmd == "c" else [(v[0], v[1]), (v[2], v[3]), (v[4], v[5])]
            cur.extend(cubic(pos, *pts, steps=steps))
            pos = pts[2]
            if cmd == "C":
                cmd = "S"
            else:
                cmd = "s"
        elif cmd in "Aa":
            rx, ry, rot, la, sw, x, y = take(7)
            end = (pos[0] + x, pos[1] + y) if cmd == "a" else (x, y)
            cur.extend(arc(pos, rx, ry, rot, int(la), int(sw), end, steps=steps))
            pos = end
        else:
            raise ValueError(f"unsupported command {cmd!r}")

    if cur:
        polys.append(cur)
    return polys


def mark_mask():
    """The spade silhouette, in tile coordinates, as a filled mask."""
    k = BIG / TILE
    mask = Image.new("L", (BIG, BIG), 0)
    d = ImageDraw.Draw(mask)
    for poly in flatten(SPADE):
        if len(poly) < 3:
            continue
        pts = [
            ((MARK_X + x * MARK_SCALE) * k, (MARK_Y + y * MARK_SCALE) * k)
            for x, y in poly
        ]
        d.polygon(pts, fill=255)
    return mask


def gold_tile():
    grad = Image.new("RGB", (BIG, BIG))
    g = ImageDraw.Draw(grad)
    for y in range(BIG):
        t = y / (BIG - 1)
        g.line([(0, y), (BIG, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(GOLD_TOP, GOLD_BOTTOM)))
    mask = Image.new("L", (BIG, BIG), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, BIG - 1, BIG - 1), radius=round(BIG * 0.25), fill=255)
    return grad, mask


def main():
    tile_mask = gold_tile()[1]
    tile = Image.new("RGB", (BIG, BIG), INK)
    tile.paste(gold_tile()[0], (0, 0), tile_mask)
    spade = mark_mask()
    # the stem is a stroked line in the icon, not a filled path
    k = BIG / TILE
    stem_x = (MARK_X + 12 * MARK_SCALE) * k
    ImageDraw.Draw(spade).line(
        [(stem_x, (MARK_Y + 17.4 * MARK_SCALE) * k), (stem_x, (MARK_Y + 22.4 * MARK_SCALE) * k)],
        fill=255, width=round(1.5 * MARK_SCALE * k),
    )
    tile.paste(Image.new("RGB", (BIG, BIG), INK), (0, 0), spade)

    icon = tile.resize((SIZE, SIZE), Image.LANCZOS)
    icon.save("app/icon.png")
    icon.resize((180, 180), Image.LANCZOS).save("app/apple-icon.png")

    # Maskable variant: Android crops to a circle of 80% diameter, so the
    # artwork is inset to 60% and the gold is bled to the full canvas edge.
    # Without this the spade's corners get sliced off on a home screen.
    inner = icon.resize((round(SIZE * 0.6), round(SIZE * 0.6)), Image.LANCZOS)
    pad = round(SIZE * 0.2)
    bleed = Image.new("RGB", (SIZE, SIZE), GOLD_TOP)
    maskable = bleed.copy()
    maskable.paste(inner, (pad, pad))
    maskable.save("public/icon-maskable.png")

    # text preview so the silhouette can be eyeballed without an image viewer
    preview = spade.resize((36, 36), Image.LANCZOS)
    px = preview.load()
    print("\n".join("".join("#" if px[x, y] > 128 else ("+" if px[x, y] > 40 else ".") for x in range(36)) for y in range(36)))


main()
