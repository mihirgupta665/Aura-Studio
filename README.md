# ✨ AURA STUDIO — AI Spatial Drawing & Gesture Studio

AURA is a premium, zero-latency client-side air drawing application powered by **MediaPipe WebAssembly (WASM)** and a compiled static-site architecture. It converts standard webcam feeds into a high-fidelity hand gesture painting interface, running fully edge-processed inside the browser.

---

## 🎨 Application Interface & Aesthetics

AURA is designed with a **sleek dark-mode aesthetic** using modern CSS typography, glassmorphism filters, and vibrant neon gradients:
*   **Canvas Studio**: Dual-split viewport separating the webcam preview tracking overlay from the paint canvas board.
*   **Performance Telemetry HUD**: Real-time telemetry monitoring rendering latencies (in milliseconds), frames-per-second (FPS), particle buffer counts, and gesture triggers.
*   **Magic Engine Particle Sandbox**: Physics-based canvas particles that burst on clicks and trail under your brush coordinate movements.
*   **Radial Menus**: Dynamic overlay sector selectors triggered by gestures (Fist for actions, Two-fingers for tools) supporting seamless, menu-free workflow loops.

---

## 🛠️ Complete Technology Stack

AURA's architecture is divided into Vision Tracking, Layout Canvas Rendering, Compilers, and Host Servers:

### 1. Vision & Tracking Engine
*   **MediaPipe Hands (WASM Engine)**: Utilizes Google's WebAssembly hand-skeleton tracking model. It tracks 21 distinct 3D hand landmarks at 30+ FPS directly inside the browser sandbox.
*   **Camera Utils SDK**: Standard library hooks for low-latency browser camera frame grabbing and scheduling.

### 2. Frontend Layer (Single-Page Application)
*   **HTML5 `<canvas>` API**: Multi-canvas layering (one for webcam skeleton annotations, one for paint lines, one for physics particle rendering).
*   **CSS3 Custom Variables**: Curated HSL color palette tailored with glassmorphic backdrops, glowing neon borders, and responsive grid layouts.
*   **Vanilla JavaScript (ES6+ Modular)**: Structured into independent modules for audio oscillators, calibration parameters, shape recognition, and gesture triggers.

### 3. Production Bundler & Backend Wrappers
*   **Python Build Bundler (`build.py`)**: A local script that reads modular HTML/CSS/JS source files and compiles them into a single-file, production-optimized page.
*   **Streamlit Core Server (`app.py`)**: A Python wrapper serving the compiled web app inside an iframe context, optimized with minimal system footprints.

---

## 🎮 Hand Gestures Telemetry & Actions

AURA classifies finger orientations based on coordinates and joint angles in real time, triggering custom audio frequencies:

| Gesture | Finger State Configuration | Trigger / Threshold Metric | Action Output | Audio Synthesizer |
| :--- | :--- | :--- | :--- | :--- |
| **Hover Move** | Index finger extended; others relaxed | Landmarks tracked continuously | Moves glowing tracking pointer | *None* |
| **Pinch Sketch** | Index tip touching thumb tip | Distance between tips < `Click Threshold` | Paints strokes or previews shape | `880Hz` sine beep (0.08s) |
| **Confirm Shape**| Thumbs Up (Thumb extended vertically) | Angle analysis of thumb coordinates | Stamps CAD shape vector guide | `950Hz` sine chime (0.15s) |
| **Undo last** | Thumbs Down (Thumb extended down) | Angle analysis of thumb coordinates | Reverts last drawn stroke | `350Hz` triangle buzz (0.08s) |
| **Command Mode** | All fingers closed in tight fist | Fingers count = 0 | Opens radial command overlay menu | `450Hz` triangle beep (0.08s) |
| **Tool Selector** | Index & Middle fingers extended | Fingers count = 2 | Opens brush/tool selection menu | `650Hz` sine pop (0.05s) |
| **Pause Canvas** | All 5 fingers extended flat (palm) | Fingers count = 4 | Pauses camera frame parsing | `220Hz` sawtooth buzz (0.12s) |

---

## 📐 Advanced Mathematical Engines

### 1. Exponential Moving Average (EMA) Jitter Filter
To smooth hand tremors and webcam tracking fluctuations, AURA applies an **EMA filter** on index coordinate offsets:

$$\mathbf{X}_{smoothed} = \alpha \cdot \mathbf{X}_{target} + (1 - \alpha) \cdot \mathbf{X}_{previous}$$

Where:
*   $\mathbf{X}_{smoothed}$ represents output canvas rendering coordinates.
*   $\alpha$ is the smoothing multiplier (user-adjustable `0.05` to `0.80` via UI sliders). Lower values weight history heavier, creating ultra-smooth brush strokes.

### 2. Bounding Area Linear Interpolation (1D Lerp)
To prevent fatigue, coordinate tracking is calibrated inside a customizable sub-region box. Landmark positions are translated to full-screen coordinates using linear interpolation:

$$\mathbf{X}_{canvas} = \frac{\mathbf{X}_{landmark} - \mathbf{B}_{left}}{\mathbf{B}_{right} - \mathbf{B}_{left}} \cdot \mathbf{W}_{canvas}$$

$$\mathbf{Y}_{canvas} = \frac{\mathbf{Y}_{landmark} - \mathbf{B}_{top}}{\mathbf{B}_{bottom} - \mathbf{B}_{top}} \cdot \mathbf{H}_{canvas}$$

This allows comfortable micro-hand movements inside the camera view to span the entire canvas board.

### 3. CAD Vector Shape Assistant
When Pinching, AURA tracks the start coordinate $(x_0, y_0)$ and current coordinate $(x_1, y_1)$ to render vector preview guidelines:
*   **Line**: Generates a straight vector from $(x_0, y_0)$ to $(x_1, y_1)$.
*   **Circle**: Calculates the Euclidean radius $R = \sqrt{(x_1 - x_0)^2 + (y_1 - y_0)^2}$ and draws a circle around $(x_0, y_0)$.
*   **Rectangle**: Draws a bounding box from top-left $(x_0, y_0)$ to bottom-right $(x_1, y_1)$.
On gesture release, the vector guide is stamped onto the permanent canvas buffer.

---

## 🚀 Setup & Local Execution

### Method 1: Lightweight HTTP Server (Recommended)
Since the client-side files are fully self-contained:
1. Open your terminal in the project folder.
2. Spin up a local server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to: **`http://localhost:8000`**

### Method 2: Python Streamlit wrapper
If running via the Streamlit dashboard:
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Streamlit app:
   ```bash
   streamlit run app.py
   ```
3. Open your browser to: **`http://localhost:8501`**

---

## 🏗️ Bundling & Compiling Source Assets
If you modify layouts, styles, or scripts inside the modular `src/` folder, re-compile them into the root `index.html` using:
```bash
python build.py
```

---

## 📦 Deployment Workflows

### Option A: Static Deployment on Vercel
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. **Important**: Change the **Application Preset** dropdown from **Python** to **Other** (since we are hosting static HTML).
5. Click **Deploy**. Your app will be live on a HTTPS domain instantly.

### Option B: Streamlit Community Cloud
1. Push your repository to GitHub.
2. Sign in to [Streamlit Share](https://share.streamlit.io/).
3. Click **New app**, select your repository, set the main entry file path to `app.py`, and click **Deploy**.

---

## 📁 Repository Structure
```
├── src/                      # Raw modular source files
│   ├── index.html            # Core layout HTML layout template
│   ├── styles.css            # Dark mode styles, transitions & keyframes
│   ├── app.js                # Canvas logic, system loops & drawing controls
│   ├── gestures.js           # Gesture detection state machine
│   ├── calibration.js        # Guided step-by-step calibration engine
│   ├── shapes.js             # CAD shape calculations & vector guides
│   ├── particles.js          # Physics particle trails & burst effects
│   └── audio.js              # Synthesized beep tones (Web Audio API)
├── index.html                # Compiled, production-ready standalone app
├── app.py                    # Streamlit wrapper to run/deploy Python server
├── build.py                  # Bundler compiler script
├── favicon.svg               # Web app custom icon
├── requirements.txt          # Minimal Python dependencies (Streamlit only)
└── README.md                 # Complete technical documentation
```
