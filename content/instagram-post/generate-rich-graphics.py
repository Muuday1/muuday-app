#!/usr/bin/env python3
"""
Generate rich Instagram post graphics for Muuday
Preply/Cimed inspired style: stock photo collages, shadows, masks, layered graphics
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import os
import urllib.request
import io
import math

# Brand colors
BRAND_BLUE = "#2563eb"
BRAND_BLUE_DARK = "#1d4ed8"
BRAND_BLUE_LIGHT = "#dbeafe"
BRAND_TEXT = "#0f172a"
BRAND_MUTED = "#475569"
WHITE = "#ffffff"
WARM_PEACH = "#fff7ed"
SOFT_BLUE = "#eff6ff"

# Dimensions
POST_W, POST_H = 1080, 1350
STORY_W, STORY_H = 1080, 1920

def load_font(name, size):
    font_paths = [
        f"C:/Windows/Fonts/{name}",
        f"C:/Windows/Fonts/segoeui.ttf",
        f"C:/Windows/Fonts/calibri.ttf",
        f"C:/Windows/Fonts/arial.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def interpolate_color(c1, c2, factor):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * factor) for i in range(3))

def create_gradient(width, height, color_top, color_bottom):
    base = Image.new('RGB', (width, height))
    c1 = hex_to_rgb(color_top)
    c2 = hex_to_rgb(color_bottom)
    for y in range(height):
        factor = y / height
        color = interpolate_color(c1, c2, factor)
        for x in range(width):
            base.putpixel((x, y), color)
    return base

def add_drop_shadow(img, offset=(15, 20), background_color=(255,255,255), 
                    shadow_color=(0,0,0,60), border=40, iterations=8, radius=15):
    """Add a soft drop shadow to an RGBA image."""
    total_width = img.size[0] + abs(offset[0]) + border * 2
    total_height = img.size[1] + abs(offset[1]) + border * 2
    shadow = Image.new('RGBA', (total_width, total_height), background_color + (0,))
    
    shadow_left = border + max(offset[0], 0)
    shadow_top = border + max(offset[1], 0)
    
    alpha = Image.new('L', img.size, 0)
    alpha.paste(img.split()[-1] if img.mode == 'RGBA' else Image.new('L', img.size, 255), (0, 0))
    
    shadow.paste(shadow_color[:3] + (shadow_color[3],), 
                 (shadow_left, shadow_top, shadow_left + img.size[0], shadow_top + img.size[1]),
                 alpha)
    
    for _ in range(iterations):
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius / iterations))
    
    # Enhance shadow opacity
    r, g, b, a = shadow.split()
    a = a.point(lambda x: min(255, int(x * 1.5)))
    shadow = Image.merge('RGBA', (r, g, b, a))
    
    img_left = border - min(offset[0], 0)
    img_top = border - min(offset[1], 0)
    shadow.paste(img, (img_left, img_top), img)
    
    return shadow

def round_corners(img, radius):
    """Round the corners of an image."""
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)
    
    alpha = Image.new('L', img.size, 255)
    w, h = img.size
    
    # Paste corner circles
    alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
    alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
    alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))
    
    img = img.convert('RGBA')
    img.putalpha(alpha)
    return img

def download_image(url, filename):
    """Download image from URL if not exists."""
    path = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(path):
        return Image.open(path).convert('RGBA')
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            img = Image.open(io.BytesIO(response.read())).convert('RGBA')
            img.save(path)
            return img
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return None

def create_preply_style_collage():
    """Preply-inspired: stock photo collage with shadows, geometric background, floating cards."""
    # Download stock photos
    img_prof = download_image(
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
        "stock_professional.png"
    )
    img_laptop = download_image(
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
        "stock_laptop.png"
    )
    
    if img_prof is None:
        # Fallback: create a colored placeholder
        img_prof = Image.new('RGBA', (600, 800), hex_to_rgb(BRAND_BLUE_LIGHT) + (255,))
    if img_laptop is None:
        img_laptop = Image.new('RGBA', (600, 600), hex_to_rgb(SOFT_BLUE) + (255,))
    
    # Create background with warm gradient + geometric shapes
    bg = create_gradient(POST_W, POST_H, "#fff0e6", "#e0f2fe")
    bg = bg.convert('RGBA')
    
    # Add large soft geometric shapes
    overlay = Image.new('RGBA', (POST_W, POST_H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    
    # Large blue circle top-right (very soft)
    od.ellipse([680, -200, 1200, 320], fill=(37, 99, 235, 18))
    # Warm circle bottom-left
    od.ellipse([-180, 900, 320, 1400], fill=(251, 146, 60, 15))
    # Small accent circle
    od.ellipse([920, 1100, 1080, 1260], fill=(37, 99, 235, 25))
    # Tiny decorative dots
    for pos in [(80, 180), (1000, 450), (120, 1150)]:
        od.ellipse([pos[0]-8, pos[1]-8, pos[0]+8, pos[1]+8], fill=(37, 99, 235, 40))
    
    bg = Image.alpha_composite(bg, overlay)
    
    # Prepare main photo - tall portrait crop with rounded corners
    prof_resized = img_prof.copy()
    prof_resized = ImageOps.fit(prof_resized, (520, 700), method=Image.LANCZOS, centering=(0.5, 0.3))
    prof_rounded = round_corners(prof_resized, 32)
    prof_with_shadow = add_drop_shadow(prof_rounded, offset=(12, 18), 
                                        shadow_color=(0, 0, 0, 50), radius=20, iterations=10)
    
    # Prepare secondary photo - smaller, overlapping
    laptop_resized = img_laptop.copy()
    laptop_resized = ImageOps.fit(laptop_resized, (340, 260), method=Image.LANCZOS, centering=(0.5, 0.4))
    laptop_rounded = round_corners(laptop_resized, 24)
    laptop_with_shadow = add_drop_shadow(laptop_rounded, offset=(10, 14), 
                                          shadow_color=(0, 0, 0, 45), radius=16, iterations=8)
    
    # Paste photos onto background
    bg.paste(prof_with_shadow, (70, 220), prof_with_shadow)
    bg.paste(laptop_with_shadow, (340, 780), laptop_with_shadow)
    
    # Draw text
    draw = ImageDraw.Draw(bg)
    
    font_headline = load_font("segoeuib.ttf", 68)
    font_sub = load_font("segoeui.ttf", 38)
    font_body = load_font("segoeui.ttf", 32)
    font_cta = load_font("segoeuib.ttf", 32)
    font_brand = load_font("segoeuib.ttf", 44)
    font_small = load_font("segoeui.ttf", 28)
    
    # Right side text block
    x_text = 610
    
    # Accent line
    draw.rounded_rectangle([x_text, 240, x_text + 80, 246], radius=3, fill=BRAND_BLUE)
    
    # Headline - stacked
    lines = ["Saudade de", "quem entende", "você?"]
    y = 280
    for line in lines:
        draw.text((x_text, y), line, font=font_headline, fill=BRAND_TEXT)
        y += 92
    
    # Subtitle
    draw.text((x_text, y + 10), "A distância não precisa", font=font_sub, fill=BRAND_MUTED)
    draw.text((x_text, y + 58), "ser uma barreira.", font=font_sub, fill=BRAND_MUTED)
    
    # Feature pills
    y_pill = y + 140
    pills = [
        ("+50 especialidades", 270),
        ("100% online", 200),
        ("Agende 24/7", 195),
    ]
    for text, w in pills:
        h = 54
        # Shadow for pill
        pill_shadow = Image.new('RGBA', (w + 8, h + 8), (0, 0, 0, 0))
        ps_draw = ImageDraw.Draw(pill_shadow)
        ps_draw.rounded_rectangle([4, 4, w+4, h+4], radius=h//2, fill=(0, 0, 0, 30))
        pill_shadow = pill_shadow.filter(ImageFilter.GaussianBlur(4))
        bg.paste(pill_shadow, (x_text - 2, y_pill - 2), pill_shadow)
        
        draw.rounded_rectangle([x_text, y_pill, x_text + w, y_pill + h], 
                               radius=h//2, fill=WHITE)
        draw.text((x_text + 20, y_pill + 10), text, font=font_body, fill=BRAND_TEXT)
        y_pill += h + 14
    
    # CTA Button with shadow
    cta_w, cta_h = 460, 68
    cta_y = POST_H - 220
    cta_shadow = Image.new('RGBA', (cta_w + 12, cta_h + 12), (0, 0, 0, 0))
    cs_draw = ImageDraw.Draw(cta_shadow)
    cs_draw.rounded_rectangle([6, 6, cta_w+6, cta_h+6], radius=18, fill=(0, 0, 0, 40))
    cta_shadow = cta_shadow.filter(ImageFilter.GaussianBlur(6))
    bg.paste(cta_shadow, (x_text - 3, cta_y - 3), cta_shadow)
    
    draw.rounded_rectangle([x_text, cta_y, x_text + cta_w, cta_y + cta_h], 
                           radius=18, fill=BRAND_BLUE)
    draw.text((x_text + 28, cta_y + 18), "Encontre seu especialista →", 
              font=font_cta, fill=WHITE)
    
    # Brand at bottom
    draw.text((x_text, POST_H - 115), "muuday", font=font_brand, fill=BRAND_BLUE)
    tagline = "Especialistas brasileiros,\nonde você estiver"
    draw.text((x_text, POST_H - 68), tagline, font=font_small, fill=BRAND_MUTED)
    
    return bg.convert('RGB')

def create_cimed_style_clean():
    """Cimed-inspired: full-bleed stock photo with gradient overlay, centered bold text."""
    img = download_image(
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
        "stock_friends.png"
    )
    if img is None:
        img = Image.new('RGBA', (POST_W, POST_H), hex_to_rgb(BRAND_BLUE) + (255,))
    else:
        img = ImageOps.fit(img, (POST_W, POST_H), method=Image.LANCZOS)
    
    # Create gradient overlay from bottom (dark) to top (transparent)
    overlay = Image.new('RGBA', (POST_W, POST_H), (0, 0, 0, 0))
    for y in range(POST_H):
        # Darker at bottom, clearer at top
        if y < POST_H * 0.4:
            alpha = 0
        else:
            factor = (y - POST_H * 0.4) / (POST_H * 0.6)
            alpha = int(180 * factor)
        for x in range(POST_W):
            overlay.putpixel((x, y), (15, 23, 42, alpha))
    
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    
    # Add a subtle blue tint overlay
    blue_overlay = Image.new('RGBA', (POST_W, POST_H), (37, 99, 235, 30))
    img = Image.alpha_composite(img, blue_overlay)
    
    draw = ImageDraw.Draw(img)
    
    font_headline = load_font("segoeuib.ttf", 88)
    font_sub = load_font("segoeui.ttf", 42)
    font_cta = load_font("segoeuib.ttf", 38)
    font_brand = load_font("segoeuib.ttf", 40)
    
    # Centered text at bottom
    headline = "Especialistas brasileiros"
    bbox = draw.textbbox((0, 0), headline, font=font_headline)
    x = (POST_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 820), headline, font=font_headline, fill=WHITE)
    
    line2 = "a um clique de distância"
    bbox = draw.textbbox((0, 0), line2, font=font_headline)
    x = (POST_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 930), line2, font=font_headline, fill=WHITE)
    
    sub = "Psicologia, nutrição, coaching e mais de 50 áreas"
    bbox = draw.textbbox((0, 0), sub, font=font_sub)
    x = (POST_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 1060), sub, font=font_sub, fill=(255, 255, 255, 200))
    
    # CTA pill
    cta_text = "Agende sua sessão →"
    bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
    cta_w = bbox[2] - bbox[0] + 60
    cta_x = (POST_W - cta_w) // 2
    draw.rounded_rectangle([cta_x, 1150, cta_x + cta_w, 1220], radius=40, fill=BRAND_BLUE)
    draw.text((cta_x + 30, 1165), cta_text, font=font_cta, fill=WHITE)
    
    # Brand
    bbox = draw.textbbox((0, 0), "muuday", font=font_brand)
    x = (POST_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 1260), "muuday", font=font_brand, fill=WHITE)
    
    return img.convert('RGB')

def create_modern_split():
    """Modern split layout: half photo, half colored with floating card."""
    img = download_image(
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
        "stock_travel.png"
    )
    if img is None:
        img = Image.new('RGBA', (600, 900), hex_to_rgb(WARM_PEACH) + (255,))
    
    # Create canvas
    canvas = Image.new('RGBA', (POST_W, POST_H), hex_to_rgb(WHITE) + (255,))
    
    # Left side: photo with rounded right corners
    photo = ImageOps.fit(img.copy(), (580, POST_H), method=Image.LANCZOS, centering=(0.5, 0.4))
    # Create rounded mask for right side only
    mask = Image.new('L', photo.size, 255)
    md = ImageDraw.Draw(mask)
    radius = 40
    # Round only right corners
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    cd = ImageDraw.Draw(circle)
    cd.ellipse((0, 0, radius * 2, radius * 2), fill=255)
    w, h = photo.size
    mask.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    mask.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))
    
    photo.putalpha(mask)
    
    # Add shadow to photo
    photo_shadow = Image.new('RGBA', (photo.size[0] + 30, photo.size[1]), (0, 0, 0, 0))
    for x in range(20):
        alpha = int(40 * (1 - x/20))
        for y in range(photo.size[1]):
            if x + 10 < photo_shadow.size[0]:
                photo_shadow.putpixel((x + 10, y), (0, 0, 0, alpha))
    photo_shadow = photo_shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.paste(photo_shadow, (0, 0), photo_shadow)
    canvas.paste(photo, (0, 0), photo)
    
    # Right side background - warm gradient
    right_bg = create_gradient(POST_W - 540, POST_H, "#fff7ed", "#dbeafe")
    right_bg = right_bg.convert('RGBA')
    canvas.paste(right_bg, (540, 0))
    
    # Floating white card
    card = Image.new('RGBA', (440, 700), hex_to_rgb(WHITE) + (255,))
    card = round_corners(card, 32)
    card_shadow = add_drop_shadow(card, offset=(8, 12), shadow_color=(0, 0, 0, 35), radius=16, iterations=8)
    canvas.paste(card_shadow, (590, 280), card_shadow)
    
    # Draw text on card area
    draw = ImageDraw.Draw(canvas)
    font_headline = load_font("segoeuib.ttf", 52)
    font_sub = load_font("segoeui.ttf", 30)
    font_body = load_font("segoeui.ttf", 26)
    font_cta = load_font("segoeuib.ttf", 28)
    
    x_card = 630
    y = 330
    
    # Accent
    draw.rounded_rectangle([x_card, y, x_card + 60, y + 5], radius=3, fill=BRAND_BLUE)
    y += 30
    
    draw.text((x_card, y), "Para quem", font=font_headline, fill=BRAND_TEXT)
    draw.text((x_card, y + 70), "mora fora", font=font_headline, fill=BRAND_TEXT)
    y += 170
    
    draw.text((x_card, y), "Profissionais brasileiros", font=font_sub, fill=BRAND_MUTED)
    draw.text((x_card, y + 42), "que entendem sua realidade.", font=font_sub, fill=BRAND_MUTED)
    y += 130
    
    # Small feature list
    items = [
        "• Psicólogos e coaches",
        "• Nutricionistas",
        "• +50 especialidades",
    ]
    for item in items:
        draw.text((x_card, y), item, font=font_body, fill=BRAND_TEXT)
        y += 48
    
    # CTA
    y += 30
    draw.rounded_rectangle([x_card, y, x_card + 280, y + 58], radius=14, fill=BRAND_BLUE)
    draw.text((x_card + 24, y + 12), "Conheça a Muuday →", font=font_cta, fill=WHITE)
    
    # Bottom brand
    draw.text((x_card, POST_H - 100), "muuday", font=load_font("segoeuib.ttf", 36), fill=BRAND_BLUE)
    draw.text((x_card, POST_H - 58), "Especialistas brasileiros", font=font_body, fill=BRAND_MUTED)
    
    return canvas.convert('RGB')

def create_story_rich():
    """Rich story version with layered photos and bold text."""
    img = download_image(
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
        "stock_professional.png"
    )
    if img is None:
        img = Image.new('RGBA', (600, 800), hex_to_rgb(BRAND_BLUE_LIGHT) + (255,))
    
    # Background gradient
    canvas = create_gradient(STORY_W, STORY_H, "#fff0e6", "#dbeafe")
    canvas = canvas.convert('RGBA')
    
    # Geometric shapes
    overlay = Image.new('RGBA', (STORY_W, STORY_H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([600, -150, 1200, 450], fill=(37, 99, 235, 20))
    od.ellipse([-200, 1400, 400, 2000], fill=(251, 146, 60, 15))
    od.ellipse([800, 1600, 1100, 1900], fill=(37, 99, 235, 25))
    canvas = Image.alpha_composite(canvas, overlay)
    
    # Main photo - large, rounded, with shadow
    photo = ImageOps.fit(img.copy(), (720, 900), method=Image.LANCZOS, centering=(0.5, 0.3))
    photo = round_corners(photo, 40)
    photo_shadow = add_drop_shadow(photo, offset=(16, 24), shadow_color=(0, 0, 0, 45), radius=24, iterations=10)
    canvas.paste(photo_shadow, (180, 200), photo_shadow)
    
    # Small floating accent photo
    img2 = download_image(
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
        "stock_laptop.png"
    )
    if img2:
        photo2 = ImageOps.fit(img2.copy(), (280, 220), method=Image.LANCZOS, centering=(0.5, 0.4))
        photo2 = round_corners(photo2, 20)
        photo2_shadow = add_drop_shadow(photo2, offset=(8, 12), shadow_color=(0, 0, 0, 40), radius=12, iterations=6)
        canvas.paste(photo2_shadow, (680, 880), photo2_shadow)
    
    # Text
    draw = ImageDraw.Draw(canvas)
    font_headline = load_font("segoeuib.ttf", 96)
    font_sub = load_font("segoeui.ttf", 44)
    font_cta = load_font("segoeuib.ttf", 40)
    font_brand = load_font("segoeuib.ttf", 52)
    
    y = 1180
    for line in ["Saudade de quem", "entende você?"]:
        bbox = draw.textbbox((0, 0), line, font=font_headline)
        x = (STORY_W - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=font_headline, fill=BRAND_TEXT)
        y += 120
    
    bbox = draw.textbbox((0, 0), "A distância não precisa ser uma barreira", font=font_sub)
    x = (STORY_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, y + 10), "A distância não precisa ser uma barreira", font=font_sub, fill=BRAND_MUTED)
    
    # CTA
    cta_y = 1580
    cta_text = "Link na bio →"
    bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
    cta_w = bbox[2] - bbox[0] + 60
    cta_x = (STORY_W - cta_w) // 2
    draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + 80], radius=24, fill=BRAND_BLUE)
    draw.text((cta_x + 30, cta_y + 18), cta_text, font=font_cta, fill=WHITE)
    
    # Brand
    bbox = draw.textbbox((0, 0), "muuday", font=font_brand)
    x = (STORY_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 1740), "muuday", font=font_brand, fill=BRAND_BLUE)
    draw.text((x, 1805), "Especialistas brasileiros, onde você estiver", 
              font=font_sub, fill=BRAND_MUTED)
    
    return canvas.convert('RGB')

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Creating Preply-style collage...")
    v1 = create_preply_style_collage()
    v1.save(os.path.join(output_dir, "rich-preply-style.png"), "PNG", quality=95)
    print("Saved: rich-preply-style.png")
    
    print("Creating Cimed-style clean overlay...")
    v2 = create_cimed_style_clean()
    v2.save(os.path.join(output_dir, "rich-cimed-style.png"), "PNG", quality=95)
    print("Saved: rich-cimed-style.png")
    
    print("Creating modern split layout...")
    v3 = create_modern_split()
    v3.save(os.path.join(output_dir, "rich-modern-split.png"), "PNG", quality=95)
    print("Saved: rich-modern-split.png")
    
    print("Creating rich story...")
    v4 = create_story_rich()
    v4.save(os.path.join(output_dir, "rich-story.png"), "PNG", quality=95)
    print("Saved: rich-story.png")
    
    print("\nAll rich graphics generated!")

if __name__ == "__main__":
    main()
