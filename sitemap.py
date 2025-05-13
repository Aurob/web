import os
import sys
import json
import xml.etree.ElementTree as ET
from datetime import datetime

args = sys.argv[1:]
if len(args) == 0:
    print("Usage: python sitemap.py <web root>")
    exit(1)

domain = args[0]
isweb = args[1] if len(args) > 1 else None

ROOT = f'{domain}/'   # Path to your web root directory
if isweb:
    ROOT = '/var/www/' + ROOT
else:
    ROOT = './'

def create_sitemap_with_index_paths(directory):
    """
    Creates a sitemap.txt, sitemap.json, and sitemap.xml listing all paths to index.html files
    with parent->child relationships.

    :param directory: The root directory to start the search from.
    """
    index_paths = []
    sitemap_structure = {}

    for root, dirs, files in os.walk(directory, followlinks=True):
        # Skip any directories that start with a dot
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        # Add paths to index.html files to the list
        dirs.sort()
        for file in files:
            if file == 'index.html':
                relative_path = os.path.relpath(root, directory)
                index_paths.append(os.path.join(relative_path, file))
                # Build the parent->child relationship
                parts = relative_path.split(os.sep)
                current_level = sitemap_structure
                for part in parts:
                    if part not in current_level:
                        current_level[part] = {}
                    current_level = current_level[part]

    # Write all index.html paths to a single sitemap.txt
    with open(os.path.join(directory, 'sitemap.txt'), 'w') as sitemap:
        for path in index_paths:
            sitemap.write(path + '\n')

    # Write the sitemap structure to a JSON file
    with open(os.path.join(directory, 'sitemap.json'), 'w') as json_file:
        json.dump(sitemap_structure, json_file, indent=4)

    # Write the sitemap structure to an XML file
    def build_xml_element(parent, structure, base_path=''):
        for key, value in structure.items():
            current_path = os.path.join(base_path, key)
            child = ET.SubElement(parent, 'url')
            loc = ET.SubElement(child, 'loc')
            loc.text = f'{domain}/{current_path}'.lstrip('./')
            
            # Get the last modified time of the index.html file
            index_file_path = os.path.join(directory, current_path, 'index.html')
            if os.path.exists(index_file_path):
                lastmod = ET.SubElement(child, 'lastmod')
                lastmod_time = os.path.getmtime(index_file_path)
                lastmod.text = datetime.fromtimestamp(lastmod_time).strftime('%Y-%m-%dT%H:%M:%S')
            
            build_xml_element(child, value, current_path)

    urlset = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    build_xml_element(urlset, sitemap_structure)
    tree = ET.ElementTree(urlset)
    tree.write(os.path.join(directory, 'sitemap.xml'), encoding='utf-8', xml_declaration=True)

create_sitemap_with_index_paths(ROOT)

print(f'Created sitemap.txt, sitemap.json, and sitemap.xml with all index.html paths under {ROOT}')
