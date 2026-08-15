import os
import streamlit as st
import streamlit.components.v1 as components

# Set up page configurations for SEO and presentation
st.set_page_config(
    page_title="AURA — AI Spatial Drawing & Gesture Studio",
    page_icon="favicon.svg",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom premium styling injected directly for SPA full-width layout and fixed top navbar
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* SPA Smooth Scroll and Global Colors */
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #09090b !important;
        overflow: hidden !important;
    }
    
    [data-testid="block-container"] {
        max-width: 100% !important;
        padding: 0 !important;
    }
    
    /* Completely hide Streamlit default sidebars, headers, and footer menu */
    section[data-testid="stSidebar"] {
        display: none !important;
    }
    [data-testid="collapsedControl"] {
        display: none !important;
    }
    header {
        display: none !important;
        visibility: hidden !important;
    }
    footer {
        display: none !important;
        visibility: hidden !important;
    }
</style>
""", unsafe_allow_html=True)

# Load the pre-compiled standalone index.html if it exists, otherwise compile it dynamically
base_path = os.path.abspath(os.path.dirname(__file__))
compiled_html_path = os.path.join(base_path, "index.html")

if os.path.exists(compiled_html_path):
    with open(compiled_html_path, "r", encoding="utf-8") as f:
        composite_html = f.read()
else:
    # Helper function to read local source files
    def load_source_file(*paths):
        full_path = os.path.join(base_path, "src", *paths)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    # Compile dynamically as fallback
    html_template = load_source_file("index.html")
    css_content = load_source_file("styles.css")
    audio_js = load_source_file("audio.js")
    particles_js = load_source_file("particles.js")
    calibration_js = load_source_file("calibration.js")
    shapes_js = load_source_file("shapes.js")
    gestures_js = load_source_file("gestures.js")
    app_js = load_source_file("app.js")

    composite_html = html_template.replace("/* CSS_PLACEHOLDER */", css_content)
    composite_html = composite_html.replace("/* AUDIO_JS */", audio_js)
    composite_html = composite_html.replace("/* PARTICLES_JS */", particles_js)
    composite_html = composite_html.replace("/* CALIBRATION_JS */", calibration_js)
    composite_html = composite_html.replace("/* SHAPES_JS */", shapes_js)
    composite_html = composite_html.replace("/* GESTURES_JS */", gestures_js)
    composite_html = composite_html.replace("/* APP_JS */", app_js)

# Embed the compiled HTML component inside the Streamlit shell
components.html(composite_html, height=920, scrolling=False)
