import os
import re
from PIL import Image

# Path configurations
images_dir = "/Users/dawood/Desktop/playground/sara_web/images"
html_path = "/Users/dawood/Desktop/playground/sara_web/index.html"

# Find which webp images are portrait
portrait_images = []
files = os.listdir(images_dir)
webp_files = [f for f in files if f.lower().endswith('.webp')]

for filename in webp_files:
    file_path = os.path.join(images_dir, filename)
    try:
        with Image.open(file_path) as img:
            width, height = img.size
            if height > width:
                portrait_images.append(filename)
    except Exception as e:
         print(f"Error reading {filename}: {e}")

print(f"Detected {len(portrait_images)} portrait images.")

# Read index.html
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Locate each gallery item and add portrait-item if its image is in portrait_images
# We can find all gallery-item blocks
pattern = r'(<div class="gallery-item"[^>]*>[\s\S]*?<img src="images/([^"]+)"[^>]*>)'

def replace_item(match):
    full_block = match.group(1)
    img_name = match.group(2)
    
    if img_name in portrait_images:
        # Check if portrait-item class is already present
        if 'portrait-item' not in full_block:
            # Replace class="gallery-item" with class="gallery-item portrait-item"
            new_block = full_block.replace('class="gallery-item"', 'class="gallery-item portrait-item"')
            print(f"Added portrait-item to: {img_name}")
            return new_block
    return full_block

updated_html = re.sub(pattern, replace_item, html_content)

# Write updated HTML
with open(html_path, "w", encoding="utf-8") as f:
    f.write(updated_html)

print("index.html updated successfully with portrait-item classes!")
