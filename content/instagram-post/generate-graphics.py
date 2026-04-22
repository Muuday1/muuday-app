#!/usr/bin/env python3
"""
Generate rich Instagram post graphics for Muuday
Uses Pillow to create high-quality, on-brand visuals
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

# Brand colors
BRAND_BLUE = "#2563eb"
BRAND_BLUE_DARK = "#1d4ed8"
BRAND_TEXT = "#0f172a"
BRAND_MUTED = "#475569"
BRAND_BG = "#f8fafc"
WHITE = "#ffffff"

# Dimensions
POST_W, POST_H = 1080, 1350  # 4:5 ratio - best for engagement
STORY_W, STORY_H = 1080, 1920  # 9:16 story ratio


def load_font(name, size):
    """Load a font from Windows Fonts or fallback to default."""
    font_paths = [
        f"C:/Windows/Fonts/{name}",
        f"C:/Windows/Fonts/arial.ttf",
        f"C:/Windows/Fonts/segoeui.ttf",
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
    """Interpolate between two RGB colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * factor) for i in range(3))


def create_gradient(width, height, color_top, color_bottom, direction="vertical"):
    """Create a smooth gradient image."""
    base = Image.new('RGB', (width, height))
    c1 = hex_to_rgb(color_top)
    c2 = hex_to_rgb(color_bottom)
    
    for y in range(height):
        if direction == "vertical":
            factor = y / height
        else:
            factor = 0  # simplified
        color = interpolate_color(c1, c2, factor)
        for x in range(width):
            base.putpixel((x, y), color)
    return base


def add_rounded_rect(draw, xy, radius, fill, opacity=255):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    # Create a temporary image for transparency support
    overlay = Image.new('RGBA', (x2 - x1, y2 - y1), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle([0, 0, x2 - x1, y2 - y1], radius=radius, fill=fill + (opacity,))
    return overlay


def draw_centered_text(draw, text, y, font, fill, width, img_width):
    """Draw centered text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    x = (img_width - text_w) // 2
    draw.text((x, y), text, font=font, fill=fill)


def draw_multiline_centered(draw, text, y_start, font, fill, img_width, line_height):
    """Draw multi-line centered text."""
    lines = text.split('\n')
    y = y_start
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = (img_width - text_w) // 2
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y


def create_main_post():
    """Create the main 4:5 feed post."""
    # Create warm, inviting gradient background
    # From soft peachy-cream to light blue-white
    img = create_gradient(POST_W, POST_H, "#fff7ed", "#eff6ff")
    
    # Add subtle decorative circles
    overlay = Image.new('RGBA', (POST_W, POST_H), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Large soft circle top-right
    overlay_draw.ellipse([650, -150, 1150, 350], fill=(37, 99, 235, 25))
    # Medium circle bottom-left
    overlay_draw.ellipse([-100, 950, 300, 1350], fill=(37, 99, 235, 20))
    # Small accent circle
    overlay_draw.ellipse([850, 1050, 1050, 1250], fill=(251, 146, 60, 30))
    
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    font_title_bold = load_font("ARIALBD.TTF", 82)
    font_title = load_font("ARIAL.TTF", 82)
    font_subtitle = load_font("ARIAL.TTF", 42)
    font_body = load_font("ARIAL.TTF", 38)
    font_small = load_font("ARIAL.TTF", 32)
    font_brand = load_font("ARIALBD.TTF", 48)
    
    # Top accent bar
    draw.rounded_rectangle([340, 80, 740, 86], radius=3, fill=BRAND_BLUE)
    
    # Main headline
    headline = "Saudade de quem\nentende você?"
    y_pos = 160
    for line in headline.split('\n'):
        bbox = draw.textbbox((0, 0), line, font=font_title_bold)
        text_w = bbox[2] - bbox[0]
        x = (POST_W - text_w) // 2
        draw.text((x, y_pos), line, font=font_title_bold, fill=BRAND_TEXT)
        y_pos += 110
    
    # Subtitle
    subtitle = "A distância não precisa ser uma barreira."
    bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
    text_w = bbox[2] - bbox[0]
    x = (POST_W - text_w) // 2
    draw.text((x, y_pos + 20), subtitle, font=font_subtitle, fill=BRAND_MUTED)
    
    # Feature boxes
    y_pos = 520
    box_width = 860
    box_height = 160
    box_x = (POST_W - box_width) // 2
    
    features = [
        ("VIDEO", "Sessões 100% online", "Por vídeo, de qualquer lugar do mundo"),
        ("50+", "+50 especialidades", "Psicólogos, nutricionistas, coaches e mais"),
        ("24/7", "Agendamento 24/7", "Escolha o horário que funciona para você"),
    ]
    
    for emoji, title, desc in features:
        # White card with soft shadow effect
        draw.rounded_rectangle([box_x, y_pos, box_x + box_width, y_pos + box_height], 
                               radius=24, fill=WHITE)
        # Blue left accent
        draw.rounded_rectangle([box_x, y_pos, box_x + 8, y_pos + box_height], 
                               radius=4, fill=BRAND_BLUE)
        
        # Icon text (bold, uppercase) - vertically centered on left
        icon_font = load_font("ARIALBD.TTF", 26)
        draw.text((box_x + 28, y_pos + 62), emoji, font=icon_font, fill=BRAND_BLUE)
        
        # Title
        draw.text((box_x + 110, y_pos + 22), title, font=font_body, fill=BRAND_TEXT)
        
        # Description
        draw.text((box_x + 110, y_pos + 82), desc, font=font_small, fill=BRAND_MUTED)
        
        y_pos += box_height + 30
    
    # CTA area
    y_pos += 30
    cta_box_h = 120
    draw.rounded_rectangle([box_x, y_pos, box_x + box_width, y_pos + cta_box_h], 
                           radius=24, fill=BRAND_BLUE)
    cta_text = "Encontre seu especialista →"
    bbox = draw.textbbox((0, 0), cta_text, font=font_subtitle)
    text_w = bbox[2] - bbox[0]
    x = (POST_W - text_w) // 2
    draw.text((x, y_pos + 32), cta_text, font=font_subtitle, fill=WHITE)
    
    # Brand at bottom
    y_pos = POST_H - 120
    brand_text = "muuday"
    bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    text_w = bbox[2] - bbox[0]
    x = (POST_W - text_w) // 2
    draw.text((x, y_pos), brand_text, font=font_brand, fill=BRAND_BLUE)
    
    tagline = "Especialistas brasileiros, onde você estiver"
    bbox = draw.textbbox((0, 0), tagline, font=font_small)
    text_w = bbox[2] - bbox[0]
    x = (POST_W - text_w) // 2
    draw.text((x, y_pos + 65), tagline, font=font_small, fill=BRAND_MUTED)
    
    # Convert back to RGB for saving
    img = img.convert('RGB')
    return img


def create_story():
    """Create a 9:16 story version."""
    img = create_gradient(STORY_W, STORY_H, "#fff7ed", "#eff6ff")
    
    overlay = Image.new('RGBA', (STORY_W, STORY_H), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.ellipse([600, -100, 1200, 500], fill=(37, 99, 235, 25))
    overlay_draw.ellipse([-150, 1400, 350, 1900], fill=(37, 99, 235, 20))
    
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)
    
    font_title = load_font("ARIALBD.TTF", 96)
    font_subtitle = load_font("ARIAL.TTF", 48)
    font_body = load_font("ARIAL.TTF", 44)
    font_small = load_font("ARIAL.TTF", 36)
    font_brand = load_font("ARIALBD.TTF", 56)
    
    # Headline
    y_pos = 300
    for line in ["Saudade de quem", "entende você?"]:
        bbox = draw.textbbox((0, 0), line, font=font_title)
        text_w = bbox[2] - bbox[0]
        x = (STORY_W - text_w) // 2
        draw.text((x, y_pos), line, font=font_title, fill=BRAND_TEXT)
        y_pos += 130
    
    # Subtitle
    sub = "A distância não precisa ser uma barreira"
    bbox = draw.textbbox((0, 0), sub, font=font_subtitle)
    text_w = bbox[2] - bbox[0]
    x = (STORY_W - text_w) // 2
    draw.text((x, y_pos + 30), sub, font=font_subtitle, fill=BRAND_MUTED)
    
    # Features - vertical stack
    y_pos = 900
    box_w = 900
    box_x = (STORY_W - box_w) // 2
    
    features = [
        ("VIDEO", "Sessões 100% online por vídeo"),
        ("50+", "+50 especialidades disponíveis"),
        ("24/7", "Agende 24/7 no seu fuso horário"),
    ]
    
    for emoji, text in features:
        draw.rounded_rectangle([box_x, y_pos, box_x + box_w, y_pos + 110], radius=20, fill=WHITE)
        draw.rounded_rectangle([box_x, y_pos, box_x + 8, y_pos + 110], radius=4, fill=BRAND_BLUE)
        icon_font = load_font("ARIALBD.TTF", 28)
        draw.text((box_x + 32, y_pos + 38), emoji, font=icon_font, fill=BRAND_BLUE)
        draw.text((box_x + 130, y_pos + 28), text, font=font_body, fill=BRAND_TEXT)
        y_pos += 140
    
    # CTA
    y_pos += 50
    draw.rounded_rectangle([box_x, y_pos, box_x + box_w, y_pos + 120], radius=24, fill=BRAND_BLUE)
    cta = "Link na bio →"
    bbox = draw.textbbox((0, 0), cta, font=font_subtitle)
    text_w = bbox[2] - bbox[0]
    x = (STORY_W - text_w) // 2
    draw.text((x, y_pos + 30), cta, font=font_subtitle, fill=WHITE)
    
    # Brand
    y_pos = STORY_H - 180
    bbox = draw.textbbox((0, 0), "muuday", font=font_brand)
    text_w = bbox[2] - bbox[0]
    x = (STORY_W - text_w) // 2
    draw.text((x, y_pos), "muuday", font=font_brand, fill=BRAND_BLUE)
    
    tag = "Especialistas brasileiros, onde você estiver"
    bbox = draw.textbbox((0, 0), tag, font=font_small)
    text_w = bbox[2] - bbox[0]
    x = (STORY_W - text_w) // 2
    draw.text((x, y_pos + 75), tag, font=font_small, fill=BRAND_MUTED)
    
    return img.convert('RGB')


def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Generating main post graphic...")
    post = create_main_post()
    post_path = os.path.join(output_dir, "post-graphic.png")
    post.save(post_path, "PNG", quality=95)
    print(f"Saved: {post_path}")
    
    print("Generating story graphic...")
    story = create_story()
    story_path = os.path.join(output_dir, "story-graphic.png")
    story.save(story_path, "PNG", quality=95)
    print(f"Saved: {story_path}")
    
    print("Done!")


if __name__ == "__main__":
    main()
