import os
import re

target_dir = r"d:\YTB\livescorefree-v2-production\lsf"
index_path = os.path.join(target_dir, "index.html")

files_to_update = [
    "live.html", "match.html", "leagues.html", "upcoming.html", 
    "trending.html", "results.html", "players.html", "news.html"
]

with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

# 1. Extract Master Sidebar
side_start = index_content.find('<aside id="sidebar"')
side_end = index_content.find('</aside>', side_start) + len('</aside>')
master_sidebar = index_content[side_start:side_end]

success_count = 0
for filename in files_to_update:
    filepath = os.path.join(target_dir, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    orig_content = content
    
    # Replace Sidebar
    s_start = content.find('<aside id="sidebar"')
    if s_start != -1:
        s_end = content.find('</aside>', s_start) + len('</aside>')
        content = content[:s_start] + master_sidebar + content[s_end:]
        
    if content != orig_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Standardized sidebar in {filename}")
        success_count += 1

print(f"Done. Standardized {success_count} sidebar blocks.")
