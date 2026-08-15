import os

def build():
    base_path = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_path, "src")
    
    # Placeholders in index.html to be replaced by their file contents
    files = {
        "/* CSS_PLACEHOLDER */": "styles.css",
        "/* AUDIO_JS */": "audio.js",
        "/* PARTICLES_JS */": "particles.js",
        "/* CALIBRATION_JS */": "calibration.js",
        "/* SHAPES_JS */": "shapes.js",
        "/* GESTURES_JS */": "gestures.js",
        "/* APP_JS */": "app.js",
    }
    
    # Read the template index.html
    template_path = os.path.join(src_dir, "index.html")
    if not os.path.exists(template_path):
        print(f"Error: Template index.html not found at {template_path}")
        return
        
    with open(template_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Inline each resource
    for placeholder, filename in files.items():
        file_path = os.path.join(src_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                file_content = f.read()
            content = content.replace(placeholder, file_content)
            print(f"Inlined {filename} into {placeholder}")
        else:
            print(f"Warning: {filename} not found at {file_path}")
            
    # Write the compiled output to root index.html
    output_path = os.path.join(base_path, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully compiled standalone production app at: {output_path}")

if __name__ == "__main__":
    build()
