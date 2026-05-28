import os
import re
from PIL import Image

# Path configurations
images_dir = "/Users/dawood/Desktop/playground/sara_web/images"
html_path = "/Users/dawood/Desktop/playground/sara_web/index.html"
max_dimension = 2048 # Perfect for crisp Retina screens while keeping filesize small

print("Scanning images directory for optimization...")

# Get list of images to convert
files = os.listdir(images_dir)
jpg_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg'))]

print(f"Found {len(jpg_files)} JPEG images to optimize.")

for idx, filename in enumerate(jpg_files):
    file_path = os.path.join(images_dir, filename)
    name_without_ext = os.path.splitext(filename)[0]
    output_path = os.path.join(images_dir, f"{name_without_ext}.webp")
    
    try:
        # Open image
        with Image.open(file_path) as img:
            original_size = os.path.getsize(file_path)
            
            # Rotate image according to EXIF data if present (to avoid sideways photos)
            try:
                # This handles orientation metadata automatically
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception as e:
                pass
            
            # Check dimensions and scale down if exceeding max_dimension
            width, height = img.size
            if width > max_dimension or height > max_dimension:
                if width > height:
                    new_width = max_dimension
                    new_height = int(height * (max_dimension / width))
                else:
                    new_height = max_dimension
                    new_width = int(width * (max_dimension / height))
                
                print(f"[{idx+1}/{len(jpg_files)}] Resizing {filename} from {width}x{height} to {new_width}x{new_height}")
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            else:
                print(f"[{idx+1}/{len(jpg_files)}] Converting {filename} ({width}x{height})")
            
            # Save as WebP
            img.save(output_path, "WEBP", quality=82)
            new_size = os.path.getsize(output_path)
            
            saved_kb = (original_size - new_size) / 1024
            percent_saved = (original_size - new_size) / original_size * 100 if original_size > 0 else 0
            print(f"   Saved {saved_kb:.1f} KB ({percent_saved:.1f}%) | {original_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB")
        
        # Delete original JPG file
        os.remove(file_path)
        
    except Exception as e:
        print(f"ERROR processing {filename}: {e}")

# Now update index.html references
print("\nUpdating index.html image references...")
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Replace any references like "images/gallery_1.jpg" or "images/hero_bg.jpg" with webp
updated_html = re.sub(r'images/([^"\']+)\.jpg', r'images/\1.webp', html_content)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(updated_html)

print("index.html updated successfully!")
print("Optimization complete!")
