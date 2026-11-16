import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new('RGB', (W, H), (10, 10, 12))
draw = ImageDraw.Draw(img)

# Premium smooth radial gradient
for y in range(H):
    for x in range(0, W, 2):
        d1 = math.sqrt((x - 320)**2 + (y - 240)**2)
        d2 = math.sqrt((x - 900)**2 + (y - 320)**2)
        g1 = max(0, int(28 * (1 - d1 / 550)))
        g2 = max(0, int(22 * (1 - d2 / 500)))

        r = min(255, 10 + int(g1 * 0.8) + int(g2 * 0.7))
        g = min(255, 10 + int(g1 * 0.9) + int(g2 * 0.8))
        b = min(255, 14 + int(g1 * 1.5) + int(g2 * 1.8))
        draw.point((x, y), fill=(r, g, b))
        draw.point((x + 1, y), fill=(r, g, b))

# Very subtle dot grid
for gx in range(40, W, 40):
    for gy in range(30, H, 40):
        draw.point((gx, gy), fill=(45, 45, 55))

font_logo = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 56)
font_h1 = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 36)
font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 19)
font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 13)
font_code = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 13)
font_card_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 14)

# Brand icon
draw.ellipse([70, 80, 136, 146], fill=(22, 22, 26), outline=(60, 60, 70), width=2)
draw.rounded_rectangle([86, 94, 120, 132], radius=3, fill=(244, 244, 245))
draw.polygon([(110, 94), (120, 104), (110, 104)], fill=(161, 161, 170))
draw.rounded_rectangle([92, 110, 112, 113], radius=1, fill=(82, 82, 91))
draw.rounded_rectangle([92, 117, 106, 120], radius=1, fill=(82, 82, 91))

# Title
draw.text((155, 83), 'Co', font=font_logo, fill=(185, 185, 195))
draw.text((228, 83), 'Draft', font=font_logo, fill=(255, 255, 255))

# Tagline (two clean lines to avoid collision with right card)
draw.text((70, 180), 'Instant collaboration.', font=font_h1, fill=(255, 255, 255))
draw.text((70, 226), 'No clutter. Just draft & go.', font=font_h1, fill=(210, 210, 220))

# Description
draw.text((70, 290), 'A high-performance real-time collaborative document editor', font=font_sub, fill=(156, 163, 175))
draw.text((70, 318), 'with live presence, markdown rules, and clean vector PDF export.', font=font_sub, fill=(156, 163, 175))

# Feature Pills (2x2 grid for clean spacing)
pills = [
    ('● Real-Time Sync', (52, 211, 153), 70, 375),
    ('● Live Carets', (96, 165, 250), 245, 375),
    ('● Markdown Rules', (244, 114, 182), 70, 425),
    ('● Vector PDF Export', (251, 191, 36), 245, 425),
]
for text, col, px, py in pills:
    tw = draw.textlength(text, font=font_badge)
    draw.rounded_rectangle([px, py, px + tw + 24, py + 34], radius=17, fill=(20, 20, 25), outline=(50, 50, 60), width=1)
    draw.text((px + 12, py + 8), text, font=font_badge, fill=col)

# Mock Editor Preview Card (Right side)
cx1, cy1, cx2, cy2 = 660, 80, 1130, 520
# Soft shadow
draw.rounded_rectangle([cx1 + 4, cy1 + 6, cx2 + 4, cy2 + 6], radius=16, fill=(5, 5, 7))
# Card container
draw.rounded_rectangle([cx1, cy1, cx2, cy2], radius=16, fill=(18, 18, 22), outline=(55, 55, 68), width=2)

# Card Header
draw.line([(cx1, cy1 + 44), (cx2, cy1 + 44)], fill=(45, 45, 55), width=1)
draw.ellipse([cx1 + 18, cy1 + 17, cx1 + 28, cy1 + 27], fill=(239, 68, 68))
draw.ellipse([cx1 + 34, cy1 + 17, cx1 + 44, cy1 + 27], fill=(245, 158, 11))
draw.ellipse([cx1 + 50, cy1 + 17, cx1 + 60, cy1 + 27], fill=(16, 185, 129))
draw.text((cx1 + 80, cy1 + 14), 'Product Design Spec.md', font=font_card_title, fill=(210, 210, 220))

# Live badge in card header
draw.rounded_rectangle([cx2 - 80, cy1 + 12, cx2 - 16, cy1 + 32], radius=10, fill=(20, 35, 28), outline=(16, 185, 129), width=1)
draw.text((cx2 - 70, cy1 + 14), '● Live', font=font_badge, fill=(52, 211, 153))

# Editor Toolbar Mock
draw.rounded_rectangle([cx1 + 16, cy1 + 56, cx2 - 16, cy1 + 88], radius=6, fill=(26, 26, 32), outline=(45, 45, 55), width=1)
draw.text((cx1 + 28, cy1 + 64), 'B   I   S   <>   |   H1   H2   |   List   Quote   |   Export PDF', font=font_code, fill=(140, 140, 155))

# Mock Editor lines
draw.text((cx1 + 24, cy1 + 115), '# System Architecture & Roadmap', font=font_card_title, fill=(255, 255, 255))
draw.text((cx1 + 24, cy1 + 145), 'CoDraft provides multi-user real-time collaboration', font=font_code, fill=(180, 180, 195))
draw.text((cx1 + 24, cy1 + 170), 'with conflict-free replicated data types (Yjs).', font=font_code, fill=(180, 180, 195))

# Quote block
draw.rounded_rectangle([cx1 + 24, cy1 + 205, cx2 - 24, cy1 + 245], radius=6, fill=(26, 26, 34))
draw.line([(cx1 + 24, cy1 + 205), (cx1 + 24, cy1 + 245)], fill=(129, 140, 248), width=3)
draw.text((cx1 + 36, cy1 + 215), 'Simplicity is prerequisite for reliability.', font=font_code, fill=(160, 160, 180))

# Collaborator 1 Pointer
draw.polygon([(cx1 + 270, cy1 + 145), (cx1 + 270, cy1 + 162), (cx1 + 276, cy1 + 157), (cx1 + 283, cy1 + 165), (cx1 + 286, cy1 + 163), (cx1 + 279, cy1 + 155), (cx1 + 286, cy1 + 155)], fill=(59, 130, 246))
draw.rounded_rectangle([cx1 + 282, cy1 + 165, cx1 + 338, cy1 + 182], radius=4, fill=(59, 130, 246))
draw.text((cx1 + 287, cy1 + 166), 'Pappu', font=font_code, fill=(255, 255, 255))

# Collaborator 2 Pointer
draw.polygon([(cx1 + 140, cy1 + 270), (cx1 + 140, cy1 + 287), (cx1 + 146, cy1 + 282), (cx1 + 153, cy1 + 290), (cx1 + 156, cy1 + 288), (cx1 + 149, cy1 + 280), (cx1 + 156, cy1 + 280)], fill=(236, 72, 153))
draw.rounded_rectangle([cx1 + 152, cy1 + 290, cx1 + 215, cy1 + 307], radius=4, fill=(236, 72, 153))
draw.text((cx1 + 157, cy1 + 291), 'Subhasish', font=font_code, fill=(255, 255, 255))

draw.text((cx1 + 24, cy1 + 270), '- Collaborative Caret tracking', font=font_code, fill=(180, 180, 195))
draw.text((cx1 + 24, cy1 + 325), '- 100% Vector PDF export with 1-click', font=font_code, fill=(180, 180, 195))
draw.text((cx1 + 24, cy1 + 355), '- Instant share links with expiration countdown', font=font_code, fill=(180, 180, 195))

# Footer
draw.text((70, 545), 'codraft.dev  |  Fast, Secure & Collaborative Drafting', font=font_sub, fill=(107, 114, 128))

out_path = os.path.join('client', 'public', 'og-image.png')
img.save(out_path, 'PNG', optimize=True)
print('Successfully generated polished og-image.png at:', out_path)
