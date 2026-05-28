import os
import shutil

# Directories
src_new = "/Users/dawood/Desktop/playground/sara_web/new"
src_ch = "/Users/dawood/Desktop/playground/sara_web/عکس چیدمان"
dest_images = "/Users/dawood/Desktop/playground/sara_web/images"

# Start index for new gallery items (we already have gallery_1 to gallery_13, and hero_bg)
start_index = 14

# Let's collect all files in both directories
new_files = [os.path.join(src_new, f) for f in os.listdir(src_new) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
ch_files = [os.path.join(src_ch, f) for f in os.listdir(src_ch) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

# Remove duplicates or specific files we don't want
# We want to skip B.A-1403-03-30-4016-Product-oriented-poster-design-04-copy (1).jpg since it's a duplicate of B.A-1403-03-30-4016-Product-oriented-poster-design-04-copy.jpg
new_files = [f for f in new_files if "copy (1)" not in f]

print(f"Found {len(new_files)} files in 'new'")
print(f"Found {len(ch_files)} files in 'عکس چیدمان'")

# We will map each file to a category and a title
# Let's inspect the files and build a mapping

items_to_process = []

# List of files in new_files:
for f in new_files:
    basename = os.path.basename(f)
    # Default category & title
    category = "editorial"
    title = "Editorial Project"
    
    if "Product-oriented-poster-design-01" in basename:
        title = "Artisan Cosmetics Poster"
        category = "editorial"
    elif "Product-oriented-poster-design-04" in basename:
        title = "Scent & Design"
        category = "editorial"
    elif "Product-oriented-poster-design-06" in basename:
        title = "Organic Essence Poster"
        category = "editorial"
    elif "cocktail" in basename:
        title = "Craft Cocktail Study"
        category = "editorial"
    elif "report" in basename:
        title = "Corporate Editorial Report"
        category = "editorial"
    elif "WA0001" in basename:
        title = "Tehran Street Contrast"
        category = "street"
    elif "WA0002" in basename:
        title = "Bazaar Walkway"
        category = "street"
    elif "WA0003" in basename:
        title = "Alleyway Reflections"
        category = "street"
    elif "WA0004" in basename:
        title = "Urban Corner"
        category = "street"
    elif "WA0006" in basename:
        title = "Tehran Transit"
        category = "street"
    elif "WA0007" in basename:
        title = "Elburz Mountain View"
        category = "landscape"
    elif "08.jpg" == basename:
        title = "Shadow Portrait"
        category = "portrait"
    elif "5435929451742496072" in basename:
        title = "Crimson Studio Session"
        category = "portrait"
    elif "5435929451742496073" in basename:
        title = "Vibrant Studio Silhouette"
        category = "portrait"
    elif "5435929451742496074" in basename:
        title = "Editorial Portrait I"
        category = "portrait"
    elif "5435929451742496075" in basename:
        title = "Editorial Portrait II"
        category = "portrait"
        
    items_to_process.append((f, category, title))

# List of files in ch_files:
for f in ch_files:
    basename = os.path.basename(f)
    category = "editorial"
    title = "Still Life Layout"
    
    if "5 guys" in basename:
        title = "Five Guys Still Life"
        category = "editorial"
    elif "Angooooor" in basename:
        title = "Grape Harvest Study"
        category = "editorial"
    elif "DSC_3508" in basename:
        title = "Studio Portrait Session"
        category = "portrait"
    elif "5 ladies" in basename:
        title = "Editorial Group Portrait"
        category = "portrait"
    elif "ghermez" in basename:
        title = "Crimson Brew Still Life"
        category = "editorial"
    elif "wine" in basename:
        title = "Bordeaux Pour Study"
        category = "editorial"
    elif "Pastil" in basename:
        title = "Gummy Pastilles Arrangement"
        category = "editorial"
    elif "sunrise" in basename:
        title = "Alborz Sunrise Range"
        category = "landscape"
    elif "Cocktail lounge" in basename:
        title = "Sunset Lounge Still Life"
        category = "editorial"
    elif "Egypt" in basename:
        title = "Sunlight on Egyptian Walls"
        category = "architecture"
    elif "clouds" in basename:
        title = "Overcast Peak Skies"
        category = "landscape"
    elif "paris" in basename:
        title = "Rainy Day in Paris"
        category = "street"
    elif "Untitled-1" in basename:
        title = "Monochrome Studio Silhouette"
        category = "portrait"
    elif "ShamimAra.jpg" == basename:
        title = "Shamim Ara Editorial"
        category = "portrait"

    items_to_process.append((f, category, title))

# Now rename and copy them
current_idx = start_index
html_blocks = []

for filepath, category, title in items_to_process:
    ext = os.path.splitext(filepath)[1].lower()
    if not ext:
        ext = ".jpg"
    new_name = f"gallery_{current_idx}{ext}"
    dest_path = os.path.join(dest_images, new_name)
    
    print(f"Copying: {filepath} -> {dest_path} | {category} | {title}")
    shutil.copy2(filepath, dest_path)
    
    # Generate HTML code block
    html_block = f"""                    <!-- Image {current_idx} -->
                    <div class="gallery-item" data-category="{category}">
                        <div class="gallery-image-wrapper">
                            <img src="images/{new_name}" alt="{title}" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">{category.capitalize()}</span>
                                    <h3 class="gallery-title">{title}</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>"""
    html_blocks.append(html_block)
    current_idx += 1

# Write generated HTML to a file in scratch
with open("/Users/dawood/Desktop/playground/sara_web/scratch/generated_gallery.html", "w") as out:
    out.write("\n".join(html_blocks))

print(f"\nSuccessfully processed {len(items_to_process)} files!")
print("HTML block written to /Users/dawood/Desktop/playground/sara_web/scratch/generated_gallery.html")
