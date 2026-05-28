import re

# File paths
html_path = "/Users/dawood/Desktop/playground/sara_web/index.html"
generated_gallery_path = "/Users/dawood/Desktop/playground/sara_web/scratch/generated_gallery.html"

# Read index.html
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Read the generated gallery HTML for images 14 to 44
with open(generated_gallery_path, "r", encoding="utf-8") as f:
    generated_gallery = f.read()

# 1. Update the filter tabs to include "Editorial"
old_tabs = """                <div class="filter-tabs" id="filterTabs">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="portrait">Portrait</button>
                    <button class="filter-btn" data-filter="landscape">Landscape</button>
                    <button class="filter-btn" data-filter="street">Street</button>
                    <button class="filter-btn" data-filter="architecture">Architecture</button>
                </div>"""

new_tabs = """                <div class="filter-tabs" id="filterTabs">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="portrait">Portrait</button>
                    <button class="filter-btn" data-filter="landscape">Landscape</button>
                    <button class="filter-btn" data-filter="street">Street</button>
                    <button class="filter-btn" data-filter="architecture">Architecture</button>
                    <button class="filter-btn" data-filter="editorial">Editorial</button>
                </div>"""

if old_tabs in html_content:
    html_content = html_content.replace(old_tabs, new_tabs)
    print("Filter tabs updated successfully with 'Editorial'!")
else:
    print("WARNING: Could not find exact old filter tabs string in index.html")

# 2. Rebuild the gallery grid contents
# Let's extract items 1 to 13 from the current html_content
# We search for the start of the gallery and grab the first 13 items
gallery_start_tag = '<div class="gallery-masonry" id="gallery">'
gallery_end_tag = '</div>'

# Let's find index of gallery_start_tag
start_idx = html_content.find(gallery_start_tag)
if start_idx == -1:
    print("ERROR: Could not find gallery start tag")
    exit(1)

# Find the end of the gallery masonry (the closing div)
# Since there are multiple </div> tags inside, let's find the closing tag after Image 14
# In index.html, we can search for the section closing tag:
section_end_tag = "</section>"
end_section_idx = html_content.find(section_end_tag, start_idx)
if end_section_idx == -1:
    print("ERROR: Could not find section end tag")
    exit(1)

# We want the closing </div> of the gallery. Let's find the last </div> before the section_end_tag
gallery_end_idx = html_content.rfind('</div>', start_idx, end_section_idx)
if gallery_end_idx == -1:
    print("ERROR: Could not find gallery end tag")
    exit(1)

# The gallery content to replace is from start_idx to gallery_end_idx + len('</div>')
old_gallery_block = html_content[start_idx:gallery_end_idx + len('</div>')]

# Let's define the first 13 items that we want to keep
first_13_items = """                <div class="gallery-masonry" id="gallery">
                    <!-- Image 1 -->
                    <div class="gallery-item" data-category="landscape">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_1.jpg" alt="Tehran Skyline" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Landscape</span>
                                    <h3 class="gallery-title">Tehran Skyline</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 2 -->
                    <div class="gallery-item" data-category="portrait">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_2.jpg" alt="Chiaroscuro Study" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Portrait</span>
                                    <h3 class="gallery-title">Chiaroscuro Study</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 3 -->
                    <div class="gallery-item" data-category="street">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_3.jpg" alt="Street Silhouette" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Street</span>
                                    <h3 class="gallery-title">Street Silhouette</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 4 -->
                    <div class="gallery-item" data-category="architecture">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_4.jpg" alt="Minimalist Lines" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Architecture</span>
                                    <h3 class="gallery-title">Minimalist Lines</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 5 -->
                    <div class="gallery-item" data-category="portrait">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_5.jpg" alt="Symmetry in Motion" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Portrait</span>
                                    <h3 class="gallery-title">Symmetry in Motion</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 6 -->
                    <div class="gallery-item" data-category="landscape">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_6.jpg" alt="Golden Hour Hills" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Landscape</span>
                                    <h3 class="gallery-title">Golden Hour Hills</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 7 -->
                    <div class="gallery-item" data-category="street">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_7.jpg" alt="Tehran After Dark" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Street</span>
                                    <h3 class="gallery-title">Tehran After Dark</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 8 -->
                    <div class="gallery-item" data-category="portrait">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_8.jpg" alt="Editorial Portrait" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Portrait</span>
                                    <h3 class="gallery-title">Editorial Portrait</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 9 -->
                    <div class="gallery-item" data-category="street">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_9.jpg" alt="Midnight Wanderer" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Street</span>
                                    <h3 class="gallery-title">Midnight Wanderer</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 10 -->
                    <div class="gallery-item" data-category="architecture">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_10.jpg" alt="Brutalist Shapes" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Architecture</span>
                                    <h3 class="gallery-title">Brutalist Shapes</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 11 -->
                    <div class="gallery-item" data-category="portrait">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_11.jpg" alt="Reflection & Light" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Portrait</span>
                                    <h3 class="gallery-title">Reflection & Light</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 12 -->
                    <div class="gallery-item" data-category="landscape">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_12.jpg" alt="Alborz Peaks" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Landscape</span>
                                    <h3 class="gallery-title">Alborz Peaks</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>
                    <!-- Image 13 -->
                    <div class="gallery-item" data-category="street">
                        <div class="gallery-image-wrapper">
                            <img src="images/gallery_13.jpg" alt="Candid Moment" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Street</span>
                                    <h3 class="gallery-title">Candid Moment</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>"""

# Image 45 (the hero background, "Misty Slopes")
image_45 = """                    <!-- Image 45 (Hero/Landscape) -->
                    <div class="gallery-item" data-category="landscape">
                        <div class="gallery-image-wrapper">
                            <img src="images/hero_bg.jpg" alt="Misty Slopes" loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-info">
                                    <span class="gallery-category">Landscape</span>
                                    <h3 class="gallery-title">Misty Slopes</h3>
                                </div>
                                <div class="gallery-view-btn">View</div>
                            </div>
                        </div>
                    </div>"""

# Combine everything
new_gallery_block = first_13_items + "\n" + generated_gallery + "\n" + image_45 + "\n                </div>"

# Replace the block in HTML
html_content = html_content.replace(old_gallery_block, new_gallery_block)
print("Gallery container content replaced successfully!")

# Save index.html
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("index.html written successfully!")
