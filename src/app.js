// Tab switching logic
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetTab = tab.getAttribute('data-tab');
                document.getElementById(`tab-content-${targetTab}`).classList.add('active');
                
                playBeep(650, 0.05);
                
                // Triggers resize paint canvas when tab-content-studio is highlighted
                if (targetTab === 'studio') {
                    setTimeout(resizePaintCanvas, 50);
                }
            });
        });


        // Onboarding overlay close listener
        const onboardingOverlay = document.getElementById('onboarding-overlay');
        const btnCloseOnboarding = document.getElementById('btn-close-onboarding');
        
        if (localStorage.getItem('aura_onboarded') === 'true') {
            onboardingOverlay.style.display = 'none';
        }
        
        btnCloseOnboarding.addEventListener('click', () => {
            onboardingOverlay.style.display = 'none';
            localStorage.setItem('aura_onboarded', 'true');
            playBeep(800, 0.1);
        });

        // Collapsible Performance HUD listener
        const btnToggleHud = document.getElementById('btn-toggle-hud');
        const hudPerfContent = document.getElementById('hud-perf-content');
        let isHudOpen = false;
        
        btnToggleHud.addEventListener('click', () => {
            isHudOpen = !isHudOpen;
            if (isHudOpen) {
                hudPerfContent.style.display = 'grid';
                btnToggleHud.querySelector('span').innerHTML = '▼';
            } else {
                hudPerfContent.style.display = 'none';
                btnToggleHud.querySelector('span').innerHTML = '▶';
            }
            playBeep(650, 0.05);
        });

        // Elements references
        const videoElement = document.getElementById('input-video');
        const canvasElement = document.getElementById('webcam-canvas');
        const canvasCtx = canvasElement.getContext('2d');
        const camHudStatus = document.getElementById('cam-hud-status');
        const sysPulse = document.getElementById('sys-pulse');
        const virtualCursor = document.getElementById('virtual-cursor');
        const workspaceBody = document.getElementById('workspace-body');
        const paintCanvas = document.getElementById('paint-canvas');
        const paintCtx = paintCanvas.getContext('2d');
        const fistCountdownOverlay = document.getElementById('fist-countdown');
        
        // Guided Auto-Calibration elements and variables
        const autoCalOverlay = document.getElementById('auto-cal-overlay');
        const autoCalTitle = document.getElementById('auto-cal-title');
        const autoCalInstructions = document.getElementById('auto-cal-instructions');
        const autoCalProgressFill = document.getElementById('auto-cal-progress-fill');
        const autoCalStatus = document.getElementById('auto-cal-status');
        const btnSkipCal = document.getElementById('btn-skip-cal');
        const btnToggleAutoCal = document.getElementById('btn-toggle-auto-cal');
        const trackingPausedOverlay = document.getElementById('tracking-paused-overlay');
        
        let isCalibrating = false;
        let calStage = 0;
        let calFrames = 0;
        let calData = {
            openDists: [],
            pinchDists: [],
            minX: 1.0,
            maxX: 0.0,
            minY: 1.0,
            maxY: 0.0
        };

        btnToggleAutoCal.addEventListener('click', () => {
            isCalibrating = true;
            calStage = 1;
            calFrames = 0;
            calData = {
                openDists: [],
                pinchDists: [],
                minX: 1.0,
                maxX: 0.0,
                minY: 1.0,
                maxY: 0.0
            };
            autoCalOverlay.style.display = 'flex';
            autoCalProgressFill.style.width = '0%';
            autoCalTitle.innerHTML = 'STAGE 1: OPEN PALM';
            autoCalInstructions.innerHTML = 'Hold your open hand clearly in front of the camera.';
            autoCalStatus.innerHTML = 'Calibrating hand scale...';
            logSystem("Guided Auto-Calibration Wizard initialized");
            playBeep(880, 0.1);
        });

        btnSkipCal.addEventListener('click', () => {
            isCalibrating = false;
            autoCalOverlay.style.display = 'none';
            logSystem("Calibration sequence cancelled by user");
            playBeep(300, 0.08, 'sawtooth');
        });
        const countdownLabel = document.getElementById('countdown-label');
        const galleryList = document.getElementById('gallery-list');
        const noCapturesText = document.getElementById('no-captures');
        
        // HUD labels
        const hudCoordinates = document.getElementById('hud-coordinates');
        const hudFps = document.getElementById('hud-fps');
        const hudLog = document.getElementById('hud-log');

        // Sliders Elements
        const cfgDetect = document.getElementById('cfg-detect');
        const cfgTrack = document.getElementById('cfg-track');
        const cfgSmoothing = document.getElementById('cfg-smoothing');
        const cfgPinch = document.getElementById('cfg-pinch');
        const cfgBoxLeft = document.getElementById('cfg-left');
        const cfgBoxRight = document.getElementById('cfg-right');
        const cfgBoxTop = document.getElementById('cfg-top');
        const cfgBoxBottom = document.getElementById('cfg-bottom');

        // Slider Labels
        const lblCfgDetect = document.getElementById('lbl-cfg-detect');
        const lblCfgTrack = document.getElementById('lbl-cfg-track');
        const lblCfgSmoothing = document.getElementById('lbl-cfg-smoothing');
        const lblCfgPinch = document.getElementById('lbl-cfg-pinch');
        const lblCfgLeft = document.getElementById('lbl-cfg-left');
        const lblCfgRight = document.getElementById('lbl-cfg-right');
        const lblCfgTop = document.getElementById('lbl-cfg-top');
        const lblCfgBottom = document.getElementById('lbl-cfg-bottom');
        const svgActiveBox = document.getElementById('svg-active-box');

        // Dynamic parameters updated instantly in JS thread
        const bounds = {
            left: parseFloat(cfgBoxLeft.value),
            right: parseFloat(cfgBoxRight.value),
            top: parseFloat(cfgBoxTop.value),
            bottom: parseFloat(cfgBoxBottom.value),
            clickThresh: parseFloat(cfgPinch.value),
            smoothing: parseFloat(cfgSmoothing.value)
        };

        // Telemetry tracker variables
        let totalStrokes = 0;
        let totalGestures = 0;
        let pixelsTraveled = 0;
        let startSessionTime = Date.now();

        // Analytics ticker
        setInterval(() => {
            const diffSec = Math.floor((Date.now() - startSessionTime) / 1000);
            const m = Math.floor(diffSec / 60).toString().padStart(2, '0');
            const s = (diffSec % 60).toString().padStart(2, '0');
            document.getElementById('stat-time').innerHTML = `${m}:${s}`;
        }, 1000);

        function updateCalibrationSettings() {
            bounds.left = parseFloat(cfgBoxLeft.value);
            bounds.right = parseFloat(cfgBoxRight.value);
            bounds.top = parseFloat(cfgBoxTop.value);
            bounds.bottom = parseFloat(cfgBoxBottom.value);
            bounds.clickThresh = parseFloat(cfgPinch.value);
            bounds.smoothing = parseFloat(cfgSmoothing.value);
            
            // Labels
            lblCfgDetect.innerHTML = parseFloat(cfgDetect.value).toFixed(2);
            lblCfgTrack.innerHTML = parseFloat(cfgTrack.value).toFixed(2);
            lblCfgSmoothing.innerHTML = parseFloat(cfgSmoothing.value).toFixed(2);
            lblCfgPinch.innerHTML = parseFloat(cfgPinch.value).toFixed(2);
            lblCfgLeft.innerHTML = parseFloat(cfgBoxLeft.value).toFixed(2);
            lblCfgRight.innerHTML = parseFloat(cfgBoxRight.value).toFixed(2);
            lblCfgTop.innerHTML = parseFloat(cfgBoxTop.value).toFixed(2);
            lblCfgBottom.innerHTML = parseFloat(cfgBoxBottom.value).toFixed(2);
            
            // Scale and reposition SVG Active Bounding box dynamically
            const svgWidth = document.getElementById('active-box-svg-preview').clientWidth || 200;
            const svgHeight = document.getElementById('active-box-svg-preview').clientHeight || 150;
            
            const x = bounds.left * svgWidth;
            const y = bounds.top * svgHeight;
            const w = (bounds.right - bounds.left) * svgWidth;
            const h = (bounds.bottom - bounds.top) * svgHeight;
            
            svgActiveBox.setAttribute('x', x);
            svgActiveBox.setAttribute('y', y);
            svgActiveBox.setAttribute('width', w);
            svgActiveBox.setAttribute('height', h);

            // Re-apply options to MediaPipe hands object
            if (hands) {
                hands.setOptions({
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: parseFloat(cfgDetect.value),
                    minTrackingConfidence: parseFloat(cfgTrack.value)
                });
            }
        }

        [cfgDetect, cfgTrack, cfgSmoothing, cfgPinch, cfgBoxLeft, cfgBoxRight, cfgBoxTop, cfgBoxBottom].forEach(slider => {
            slider.addEventListener('input', updateCalibrationSettings);
            slider.addEventListener('change', () => {
                logSystem("Calibration updated");
                playBeep(650, 0.05);
            });
        });

// Setup Paint Canvas size
// Setup Paint Canvas size
        function resizePaintCanvas() {
            const w = paintCanvas.offsetWidth || 800;
            const h = paintCanvas.offsetHeight || 600;
            
            let prevData = null;
            if (paintCanvas.width > 0 && paintCanvas.height > 0) {
                try {
                    prevData = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
                } catch (e) {
                    console.warn("Could not backup canvas data:", e);
                }
            }
            
            paintCanvas.width = w;
            paintCanvas.height = h;
            
            if (prevData) {
                try {
                    paintCtx.putImageData(prevData, 0, 0);
                } catch (e) {
                    console.warn("Could not restore canvas data:", e);
                }
            }
            paintCtx.lineCap = 'round';
            paintCtx.lineJoin = 'round';
        }
        window.addEventListener('load', resizePaintCanvas);
        window.addEventListener('resize', resizePaintCanvas);

        // Core Drawing configurations
        let activeColor = '#8b5cf6';
        let activeMode = 'draw'; 
        let brushSize = 3;
        let activeBrush = 'pencil';
        let activeBgStyle = 'solid';
        let isDrawing = false;
        let isMirrored = true;
        let smoothX = 0;
        let smoothY = 0;
        let lastPaintX = 0;
        let lastPaintY = 0;
        let isHandDetected = false;
        let radialMenuCenter = { x: 0, y: 0 };
        let lastHandLandmarks = null;

        // Undo Snapshot Stack
        let drawingHistory = [];
        function saveHistoryState() {
            if (paintCanvas.width > 0 && paintCanvas.height > 0) {
                if (drawingHistory.length >= 25) {
                    drawingHistory.shift();
                }
                try {
                    drawingHistory.push(paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
                } catch (e) {
                    console.error("Failed to save history state:", e);
                }
            }
            totalStrokes++;
            document.getElementById('stat-strokes').innerHTML = totalStrokes;
        }

        function undoLastAction() {
            if (drawingHistory.length > 0) {
                const prevSnapshot = drawingHistory.pop();
                paintCtx.putImageData(prevSnapshot, 0, 0);
                logSystem("Undo stroke committed");
                playBeep(350, 0.08, 'triangle');
            } else {
                logSystem("Nothing to undo");
                playBeep(180, 0.08, 'sawtooth');
            }
        }

        function clearCanvas() {
            saveHistoryState();
            paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
            logSystem("Canvas cleared");
            playBeep(200, 0.15, 'triangle');
        }

        function saveCanvasImage() {
            try {
                const downloadCanvas = document.createElement('canvas');
                downloadCanvas.width = paintCanvas.width;
                downloadCanvas.height = paintCanvas.height;
                const dCtx = downloadCanvas.getContext('2d');
                
                // Draw background matching plain dark
                dCtx.fillStyle = '#09090b';
                dCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
                dCtx.drawImage(paintCanvas, 0, 0);
                
                const dataURL = downloadCanvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.download = `aura_painting_${Math.floor(Date.now()/1000)}.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                logSystem("Artwork saved successfully");
                playBeep(950, 0.1, 'sine');
            } catch(e) {
                logSystem("Save error: " + e);
            }
        }

        // Toolbar Events
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                activeColor = dot.getAttribute('data-color');
                activeMode = 'draw';
                document.getElementById('btn-mode-draw').classList.add('active');
                document.getElementById('btn-mode-erase').classList.remove('active');
                playBeep(600, 0.05);
            });
        });

        document.getElementById('custom-color').addEventListener('input', (e) => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            activeColor = e.target.value;
            activeMode = 'draw';
            document.getElementById('btn-mode-draw').classList.add('active');
            document.getElementById('btn-mode-erase').classList.remove('active');
        });

        document.getElementById('btn-mode-draw').addEventListener('click', () => {
            activeMode = 'draw';
            document.getElementById('btn-mode-draw').classList.add('active');
            document.getElementById('btn-mode-erase').classList.remove('active');
            playBeep(550, 0.05);
        });

        document.getElementById('btn-mode-erase').addEventListener('click', () => {
            activeMode = 'erase';
            document.getElementById('btn-mode-erase').classList.add('active');
            document.getElementById('btn-mode-draw').classList.remove('active');
            playBeep(550, 0.05);
        });

        document.querySelectorAll('.size-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.size-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                brushSize = parseInt(dot.getAttribute('data-size'));
                playBeep(650, 0.05);
            });
        });

        document.getElementById('sel-brush').addEventListener('change', (e) => {
            activeBrush = e.target.value;
            const magicThemes = ['celestial', 'plasma', 'ember', 'frost', 'sakura', 'quantum'];
            if (magicThemes.includes(activeBrush)) {
                cfgParticleTheme.value = activeBrush;
            } else if (activeBrush === 'magic') {
                cfgParticleTheme.value = 'celestial';
            }
            playBeep(600, 0.05);
        });

        const paintCanvasEl = document.getElementById('paint-canvas');
        document.getElementById('sel-bg-style').addEventListener('change', (e) => {
            activeBgStyle = e.target.value;
            // Apply background style class
            paintCanvasEl.className = '';
            if (activeBgStyle !== 'solid') {
                paintCanvasEl.classList.add(activeBgStyle);
            }
            playBeep(600, 0.05);
        });

        document.getElementById('btn-mirror').addEventListener('click', () => {
            isMirrored = !isMirrored;
            const btnMirror = document.getElementById('btn-mirror');
            if (isMirrored) {
                btnMirror.classList.add('active');
                canvasElement.style.transform = 'scaleX(-1)';
            } else {
                btnMirror.classList.remove('active');
                canvasElement.style.transform = 'scaleX(1)';
            }
            playBeep(550, 0.05);
        });

        document.getElementById('btn-undo-action').addEventListener('click', undoLastAction);
        document.getElementById('btn-clear-canvas').addEventListener('click', clearCanvas);
        document.getElementById('btn-save-canvas').addEventListener('click', saveCanvasImage);

        // System logger helper
        function logSystem(msg) {
            hudLog.innerHTML = msg;
            
            // Log to lab logs
            const labLogs = document.getElementById('gesture-logs');
            labLogs.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${msg}`;
            labLogs.scrollTop = labLogs.scrollHeight;
        }

// Particle Sandbox Animation Loops
        const sandboxCanvas = document.getElementById('sandbox-canvas');
        const sandboxCtx = sandboxCanvas.getContext('2d');
        let sandboxParticles = [];

        function resizeSandboxCanvas() {
            sandboxCanvas.width = sandboxCanvas.offsetWidth;
            sandboxCanvas.height = sandboxCanvas.offsetHeight;
        }
        window.addEventListener('load', resizeSandboxCanvas);

        sandboxCanvas.addEventListener('mousemove', (e) => {
            const rect = sandboxCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const maxBudget = parseInt(cfgMaxParticles.value);
            const speedCoeff = parseFloat(cfgParticleSpeed.value);
            const theme = cfgParticleTheme.value;
            
            for (let i = 0; i < 2; i++) {
                if (sandboxParticles.length >= maxBudget) sandboxParticles.shift();
                sandboxParticles.push(new Particle(mouseX, mouseY, theme));
            }
        });

        function animateSandbox() {
            sandboxCtx.clearRect(0, 0, sandboxCanvas.width, sandboxCanvas.height);
            
            // Draw dark backdrop gradient
            sandboxCtx.fillStyle = '#020617';
            sandboxCtx.fillRect(0, 0, sandboxCanvas.width, sandboxCanvas.height);

            for (let i = sandboxParticles.length - 1; i >= 0; i--) {
                const p = sandboxParticles[i];
                p.update(16); // assume ~16.6ms frame time
                if (p.life <= 0) {
                    sandboxParticles.splice(i, 1);
                } else {
                    p.draw(sandboxCtx);
                }
            }
            requestAnimationFrame(animateSandbox);
        }
        requestAnimationFrame(animateSandbox);

        // ------------------ SHAPE ASSISTANT (GEOMETRIC CLASSIFIER) ------------------
        let isShapeAssistActive = false;
        let strokePoints = [];
        let pendingShape = null;

// ------------------ REPLAY ENGINE PLAYER ------------------
        let recordedStrokes = []; // coordinates trajectory history
        let isReplaying = false;
        let replayFrameIndex = 0;
        let replayCanvas = document.getElementById('replay-canvas');
        let replayCtx = replayCanvas.getContext('2d');
        let replayTimer = null;

        document.getElementById('btn-replay-play').addEventListener('click', () => {
            if (recordedStrokes.length === 0) {
                logSystem("No drawing coordinates recorded yet.");
                playBeep(250, 0.08, 'sawtooth');
                return;
            }
            
            isReplaying = true;
            document.getElementById('btn-replay-play').classList.add('active');
            document.getElementById('btn-replay-pause').classList.remove('active');
            
            replayCanvas.width = replayCanvas.offsetWidth;
            replayCanvas.height = replayCanvas.offsetHeight;
            
            replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);
            replayFrameIndex = 0;
            
            if (replayTimer) clearInterval(replayTimer);
            replayTimer = setInterval(tickReplayPlayer, 30);
            logSystem("Replaying spatial drawing coordinates...");
            playBeep(700, 0.1, 'sine');
        });

        document.getElementById('btn-replay-pause').addEventListener('click', () => {
            isReplaying = false;
            document.getElementById('btn-replay-pause').classList.add('active');
            document.getElementById('btn-replay-play').classList.remove('active');
            if (replayTimer) clearInterval(replayTimer);
        });

        document.getElementById('btn-replay-reset').addEventListener('click', () => {
            isReplaying = false;
            if (replayTimer) clearInterval(replayTimer);
            replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);
            document.getElementById('replay-hud-status').innerHTML = `Player idle. Recorded Strokes: ${recordedStrokes.length}`;
            playBeep(300, 0.08);
        });

        function tickReplayPlayer() {
            if (!isReplaying || replayFrameIndex >= recordedStrokes.length) {
                clearInterval(replayTimer);
                isReplaying = false;
                document.getElementById('btn-replay-play').classList.remove('active');
                logSystem("Replay finished.");
                return;
            }

            const pt = recordedStrokes[replayFrameIndex];
            
            // Draw on replay canvas
            replayCtx.save();
            replayCtx.lineWidth = pt.size;
            replayCtx.strokeStyle = pt.color;
            replayCtx.lineCap = 'round';
            
            if (pt.isStart || replayFrameIndex === 0) {
                replayCtx.beginPath();
                replayCtx.moveTo(pt.x, pt.y);
            } else {
                const prevPt = recordedStrokes[replayFrameIndex - 1];
                replayCtx.beginPath();
                replayCtx.moveTo(prevPt.x, prevPt.y);
                replayCtx.lineTo(pt.x, pt.y);
                replayCtx.stroke();
            }
            replayCtx.restore();

            // Generate magical replay particles matching speed!
            const speed = 1.0;
            const maxBudget = parseInt(cfgMaxParticles.value);
            const theme = cfgParticleTheme.value;
            
            // Draw sandbox style overlay
            createParticlesBurst(pt.x, pt.y, 2);

            document.getElementById('replay-hud-status').innerHTML = `Playing frame: ${replayFrameIndex} / ${recordedStrokes.length}`;
            replayFrameIndex++;
        }

        // ------------------ MEDIAPIPE CORE VISION LOOP ------------------
        let fpsCounter = 0;
        let lastFpsTime = Date.now();
        let wasmFps = 60;

        function onResults(results) {
            const startExecutionTime = performance.now();
            // FPS telemetry
            fpsCounter++;
            const now = Date.now();
            if (now - lastFpsTime >= 1000) {
                wasmFps = fpsCounter;
                hudFps.innerHTML = `FPS: ${wasmFps}`;
                document.getElementById('hud-fps').innerHTML = `FPS: ${wasmFps}`;
                document.getElementById('metric-fps').innerHTML = wasmFps;
                fpsCounter = 0;
                lastFpsTime = now;
            }

            // Real processing latency calculation
            const latencyMs = Math.round(performance.now() - frameStartTimestamp);
            document.getElementById('metric-latency').innerHTML = `${latencyMs} ms`;

            if (canvasElement.width !== results.image.width || canvasElement.height !== results.image.height) {
                canvasElement.width = results.image.width;
                canvasElement.height = results.image.height;
            }

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            
            // Render Bounding Active Region Box overlay
            const boxX = bounds.left * canvasElement.width;
            const boxY = bounds.top * canvasElement.height;
            const boxW = (bounds.right - bounds.left) * canvasElement.width;
            const boxH = (bounds.bottom - bounds.top) * canvasElement.height;
            
            canvasCtx.strokeStyle = "rgba(6, 182, 212, 0.65)";
            canvasCtx.lineWidth = 1.5;
            canvasCtx.setLineDash([8, 4]);
            canvasCtx.strokeRect(boxX, boxY, boxW, boxH);
            
            canvasCtx.restore();

            // Run auto-calibration step if active and return
            if (isCalibrating) {
                runAutoCalibrationStep(results);
                return;
            }

            let detected = false;

            // Two-hand zooming / panning tracking logic
            if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
                detected = true;
                isHandDetected = true;
                trackingPausedOverlay.style.display = 'none';
                sysPulse.classList.add('active');
                
                const h1 = results.multiHandLandmarks[0];
                const h2 = results.multiHandLandmarks[1];
                
                drawConnectors(canvasCtx, h1, HAND_CONNECTIONS, {color: '#8b5cf6', lineWidth: 1.5});
                drawLandmarks(canvasCtx, h1, {color: '#ec4899', lineWidth: 0.5, radius: 1.5});
                drawConnectors(canvasCtx, h2, HAND_CONNECTIONS, {color: '#8b5cf6', lineWidth: 1.5});
                drawLandmarks(canvasCtx, h2, {color: '#ec4899', lineWidth: 0.5, radius: 1.5});
                
                // Helper to classify if a hand is in a closed fist state
                const isHandFist = (landmarks) => {
                    const handScale = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
                    const normDist = (a, b) => Math.hypot(landmarks[a].x - landmarks[b].x, landmarks[a].y - landmarks[b].y) / handScale;
                    
                    const isIndexExtended = landmarks[8].y < landmarks[6].y;
                    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
                    const isRingExtended = landmarks[16].y < landmarks[14].y;
                    const isPinkyExtended = landmarks[20].y < landmarks[18].y;
                    
                    const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;
                    return extendedFingers === 0 && normDist(4, 5) < 0.22;
                };

                const h1Fist = isHandFist(h1);
                const h2Fist = isHandFist(h2);

                if (h1Fist && h2Fist) {
                    camHudStatus.innerHTML = "ZOOM LOCKED (RELEASE ONE HAND TO DRAW)";
                    camHudStatus.style.color = "var(--success)";
                    // Freeze zoom & pan by resetting baseline tracking distance / midpoint
                    prevTwoHandDist = null;
                    prevTwoHandMid = null;
                } else {
                    camHudStatus.innerHTML = "ZOOM & PAN ACTIVE";
                    camHudStatus.style.color = "var(--secondary)";
                    
                    const pt1 = { x: h1[8].x, y: h1[8].y };
                    const pt2 = { x: h2[8].x, y: h2[8].y };
                    
                    const currentDist = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
                    const currentMid = { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
                    
                    if (prevTwoHandDist !== null) {
                        const zoomFactor = currentDist / prevTwoHandDist;
                        canvasZoom = Math.max(0.5, Math.min(3.0, canvasZoom * zoomFactor));
                        
                        const dx = (isMirrored ? -(currentMid.x - prevTwoHandMid.x) : (currentMid.x - prevTwoHandMid.x)) * paintCanvas.offsetWidth;
                        const dy = (currentMid.y - prevTwoHandMid.y) * paintCanvas.offsetHeight;
                        canvasPanX += dx;
                        canvasPanY += dy;
                        
                        paintCanvas.style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoom})`;
                        const pC = document.getElementById('particle-canvas');
                        if (pC) {
                            pC.style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoom})`;
                        }
                        
                        logSystem(`Zoom: ${canvasZoom.toFixed(2)}x | Pan: (${Math.round(canvasPanX)}, ${Math.round(canvasPanY)})`);
                    }
                    
                    prevTwoHandDist = currentDist;
                    prevTwoHandMid = currentMid;
                }
                
                document.getElementById('magic-cursor-glow').style.display = 'none';
                document.getElementById('metric-hands').innerHTML = "2";
                return;
            } else {
                prevTwoHandDist = null;
                prevTwoHandMid = null;
                document.getElementById('metric-hands').innerHTML = (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) ? "1" : "0";
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                detected = true;
                const landmarks = results.multiHandLandmarks[0];
                lastHandLandmarks = landmarks;

                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#8b5cf6', lineWidth: 1.5});
                drawLandmarks(canvasCtx, landmarks, {color: '#ec4899', lineWidth: 0.5, radius: 1.5});

                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];

                // Scale hand scale normalization factor
                const handScale = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
                const normDist = (a, b) => Math.hypot(landmarks[a].x - landmarks[b].x, landmarks[a].y - landmarks[b].y) / handScale;

                // Classified gestures checks with pinch hysteresis
                let isPinch = false;
                const pinchDistVal = normDist(4, 8);
                if (isDrawing) {
                    isPinch = pinchDistVal < (bounds.clickThresh * 1.25);
                } else {
                    isPinch = pinchDistVal < bounds.clickThresh;
                }

                const isIndexExtended = landmarks[8].y < landmarks[6].y;
                const isMiddleExtended = landmarks[12].y < landmarks[10].y;
                const isRingExtended = landmarks[16].y < landmarks[14].y;
                const isPinkyExtended = landmarks[20].y < landmarks[18].y;
                
                const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

                // Gesture Classification mapping
                rawGesture = 'none';
                
                if (isPinch) {
                    rawGesture = 'pinch';
                } else if (extendedFingers === 4) {
                    rawGesture = 'palm';
                } else if (extendedFingers === 0 && normDist(4, 5) < 0.22) {
                    rawGesture = 'fist';
                } else if (landmarks[8].y < landmarks[6].y && landmarks[12].y < landmarks[10].y && extendedFingers === 2) {
                    rawGesture = 'two_fingers';
                } else if (landmarks[4].y < landmarks[2].y && extendedFingers === 0) {
                    rawGesture = 'thumbs_up';
                } else if (landmarks[4].y > landmarks[2].y && extendedFingers === 0) {
                    rawGesture = 'thumbs_down';
                }

                // Gesture Classification State Machine with Edge Triggers
                Object.keys(gestureStates).forEach(g => {
                    if (rawGesture === g) {
                        gestureStates[g].frames++;
                        if (gestureStates[g].frames >= STABILITY_FRAMES_THRESHOLD) {
                            if (!gestureStates[g].stable) {
                                gestureStates[g].stable = true;
                                stableGesture = g;
                                handleGestureEventTrigger(g);
                            }
                        }
                    } else {
                        if (gestureStates[g].stable) {
                            gestureStates[g].stable = false;
                            gestureStates[g].frames = 0;
                            handleGestureRelease(g);
                        } else {
                            gestureStates[g].frames = 0;
                        }
                    }
                });

                // Set stable gesture to current stable one (or none if none are stable)
                let activeStable = Object.values(gestureStates).find(s => s.stable);
                stableGesture = activeStable ? activeStable.name : 'none';

                // Smooth coordinates using EMA Filter
                let normX = (indexTip.x - bounds.left) / (bounds.right - bounds.left);
                let normY = (indexTip.y - bounds.top) / (bounds.bottom - bounds.top);
                normX = Math.max(0.0, Math.min(1.0, normX));
                normY = Math.max(0.0, Math.min(1.0, normY));

                if (isMirrored) {
                    normX = 1.0 - normX;
                }

                const workWidth = paintCanvas.offsetWidth;
                const workHeight = paintCanvas.offsetHeight;
                const targetX = normX * workWidth;
                const targetY = normY * workHeight;

                smoothX = smoothX + bounds.smoothing * (targetX - smoothX);
                smoothY = smoothY + bounds.smoothing * (targetY - smoothY);

                // Update Virtual Cursor position HUD
                hudCoordinates.innerHTML = `Cursor: (${Math.round(smoothX)}, ${Math.round(smoothY)})`;
                
                // VisualCursor tracking dot style
                document.getElementById('magic-cursor-glow').style.display = 'block';
                document.getElementById('magic-cursor-glow').style.left = `${paintCanvas.offsetLeft + smoothX}px`;
                document.getElementById('magic-cursor-glow').style.top = `${paintCanvas.offsetTop + smoothY}px`;

                // Calculate distance pixels traveled
                const distTraveled = Math.hypot(smoothX - lastPaintX, smoothY - lastPaintY);
                if (distTraveled > 1 && distTraveled < 100) {
                    pixelsTraveled += Math.round(distTraveled);
                    document.getElementById('stat-pixels').innerHTML = `${pixelsTraveled} px`;
                }

                // 1. PINCH DRAWING
                if (stableGesture === 'pinch') {
                    handleVirtualPinchDrag(smoothX, smoothY);
                } else {
                    if (isDrawing) {
                        isDrawing = false;
                        handleStrokeFinishEvent();
                    }
                }

                // 2. FIST CAPTURE TIMER
                if (stableGesture === 'fist' && !isCommandMenuOpen && !isToolMenuOpen) {
                    if (!isFistCountdown) {
                        isFistCountdown = true;
                        fistTimerStart = Date.now();
                        fistCountdownOverlay.style.display = 'flex';
                        playBeep(450, 0.08, 'triangle');
                    }
                    
                    const timeHeld = Date.now() - fistTimerStart;
                    const pct = Math.min(100, Math.floor((timeHeld / FIST_SCREENSHOT_HOLD_MS) * 100));
                    countdownLabel.innerHTML = `TAKING CAPTURE IN ${pct}%`;
                    
                    if (timeHeld >= FIST_SCREENSHOT_HOLD_MS) {
                        triggerVirtualCanvasCapture();
                        isFistCountdown = false;
                        fistCountdownOverlay.style.display = 'none';
                        stableGesture = 'none';
                        gestureStates.fist.stable = false; // force reset
                    }
                } else {
                    if (isFistCountdown) {
                        isFistCountdown = false;
                        fistCountdownOverlay.style.display = 'none';
                    }
                }

                // 3. RADIAL MENU INTERACTION
                if (isCommandMenuOpen) {
                    updateRadialMenuHoverState(fistMenu, landmarks, 'command');
                } else if (isToolMenuOpen) {
                    updateRadialMenuHoverState(toolMenu, landmarks, 'tool');
                }

                // Update visual metrics in Lab dashboard meters
                updateLabMeters(rawGesture);

            } else {
                if (isFistCountdown) {
                    isFistCountdown = false;
                    fistCountdownOverlay.style.display = 'none';
                }
                
                // Hide virtual cursor dot
                document.getElementById('magic-cursor-glow').style.display = 'none';

                // Clean reset of all gesture states on tracking lost
                rawGesture = 'none';
                stableGesture = 'none';
                Object.keys(gestureStates).forEach(g => {
                    if (gestureStates[g].stable) {
                        gestureStates[g].stable = false;
                        gestureStates[g].frames = 0;
                        handleGestureRelease(g);
                    } else {
                        gestureStates[g].frames = 0;
                    }
                });
            }

            // Sync presence flag globally
            isHandDetected = detected;

            // Pulse indicators
            if (detected) {
                sysPulse.classList.add('active');
                camHudStatus.innerHTML = "SYSTEM ACTIVE - TRACKING GESTURES";
                camHudStatus.style.color = "var(--success)";
            } else {
                sysPulse.classList.remove('active');
                camHudStatus.innerHTML = "SEARCHING FOR HAND...";
                camHudStatus.style.color = "var(--danger)";
            }

            // Update execution performance metrics
            const executionTimeMs = Math.round(performance.now() - startExecutionTime);
            const hudFrameTime = document.getElementById('metric-frame-time');
            if (hudFrameTime) {
                hudFrameTime.innerHTML = `${executionTimeMs}ms`;
            }
            const hudMetricDetect = document.getElementById('metric-detect');
            if (hudMetricDetect) {
                hudMetricDetect.innerHTML = stableGesture.toUpperCase();
            }
        }

// ------------------ RADIAL HOVER GESTURES UTILS ------------------
        function layoutRadialMenu(menu, size) {
            const items = menu.querySelectorAll('.radial-item');
            const radius = size * 0.34; // Place options comfortably inside the circle
            const center = size / 2;
            
            items.forEach((item, i) => {
                const angle = (i * (2 * Math.PI) / items.length) - Math.PI / 2;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                item.style.left = `${x}px`;
                item.style.top = `${y}px`;
            });
        }

        function updateRadialMenuPosition(menu, landmarks) {
            const centerPt = landmarks[9]; // Middle finger MCP knuckle (center of fist)
            
            // Fixed area/size of the radial menu (e.g. 220px) for stability as requested
            const radialSize = 220; 
            
            menu.style.width = `${radialSize}px`;
            menu.style.height = `${radialSize}px`;
            
            // Map middle knuckle position dynamically to the camera video container
            const x_px = (isMirrored ? (1.0 - centerPt.x) : centerPt.x) * canvasElement.clientWidth;
            const y_px = centerPt.y * canvasElement.clientHeight;
            
            menu.style.left = `${x_px}px`;
            menu.style.top = `${y_px}px`;
            
            layoutRadialMenu(menu, radialSize);
        }

        function openRadialMenu(menu, type) {
            closeRadialMenus();
            
            menu.style.display = 'block';
            
            if (lastHandLandmarks) {
                updateRadialMenuPosition(menu, lastHandLandmarks);
                // Record the center of the menu when opened to compute relative movements correctly
                radialMenuCenter = { x: lastHandLandmarks[9].x, y: lastHandLandmarks[9].y };
            }
            
            if (type === 'command') {
                isCommandMenuOpen = true;
                selectedRadialCommand = 'none';
            } else {
                isToolMenuOpen = true;
                selectedRadialTool = 'none';
            }
            playBeep(700, 0.08);
        }

        function closeRadialMenus() {
            fistMenu.style.display = 'none';
            toolMenu.style.display = 'none';
            isCommandMenuOpen = false;
            isToolMenuOpen = false;
            
            document.querySelectorAll('.radial-item').forEach(itm => itm.classList.remove('active'));
        }

        function updateRadialMenuHoverState(menu, landmarks, type) {
            const currentCenter = landmarks[9]; // Middle finger MCP knuckle (current position of fist)
            const radialSize = 220; // Match fixed size for layout/threshold calculations

            // Compute movement delta (pixels) of the fist from its starting open position
            let dx = (currentCenter.x - radialMenuCenter.x) * canvasElement.clientWidth;
            // Adjust dx for horizontal mirroring if applicable
            if (isMirrored) {
                dx = -dx;
            }
            const dy = (currentCenter.y - radialMenuCenter.y) * canvasElement.clientHeight;
            const dist = Math.hypot(dx, dy);

            // Fist shift selection deadzone (increased from 9px to 25px for deliberate movement selection)
            const selectionThreshold = 25;
            if (dist < selectionThreshold) {
                document.querySelectorAll('.radial-item').forEach(itm => itm.classList.remove('active'));
                if (type === 'command') selectedRadialCommand = 'none';
                else selectedRadialTool = 'none';
                return;
            }

            // Calculate angle [0, 360]
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            if (angle < 0) angle += 360;

            const items = menu.querySelectorAll('.radial-item');
            items.forEach(itm => itm.classList.remove('active'));

            if (type === 'command') {
                // 4 Quadrants: Up (Undo), Down (Clear), Left (Eraser), Right (Brush)
                let selected = 'none';
                if (angle >= 315 || angle < 45) {
                    selected = 'brush';
                } else if (angle >= 45 && angle < 135) {
                    selected = 'clear';
                } else if (angle >= 135 && angle < 225) {
                    selected = 'eraser';
                } else {
                    selected = 'undo';
                }
                
                selectedRadialCommand = selected;
                const activeEl = menu.querySelector(`[data-cmd="${selected}"]`);
                if (activeEl) activeEl.classList.add('active');
                
            } else {
                // 5 sectors: Magic, Shape, Erase, Pencil, Ink
                // Tool selection items starting at -90 degrees (top center)
                let adjustedAngle = angle + 90;
                if (adjustedAngle < 0) adjustedAngle += 360;
                if (adjustedAngle >= 360) adjustedAngle -= 360;
                
                let sector = Math.floor(adjustedAngle / 72);
                let selected = 'magic';
                
                if (sector === 0) selected = 'magic';
                else if (sector === 1) selected = 'shapes';
                else if (sector === 2) selected = 'eraser';
                else if (sector === 3) selected = 'pencil';
                else selected = 'ink';
                
                selectedRadialTool = selected;
                const activeEl = menu.querySelector(`[data-tool="${selected}"]`);
                if (activeEl) activeEl.classList.add('active');
            }
        }

        function executeRadialAction(type) {
            if (type === 'command') {
                logSystem(`Executing radial command: ${selectedRadialCommand.toUpperCase()}`);
                if (selectedRadialCommand === 'undo') {
                    undoLastAction();
                } else if (selectedRadialCommand === 'clear') {
                    clearCanvas();
                } else if (selectedRadialCommand === 'eraser') {
                    activeMode = 'erase';
                    document.getElementById('btn-mode-erase').classList.add('active');
                    document.getElementById('btn-mode-draw').classList.remove('active');
                    playBeep(900, 0.1);
                } else if (selectedRadialCommand === 'brush') {
                    activeMode = 'draw';
                    document.getElementById('btn-mode-draw').classList.add('active');
                    document.getElementById('btn-mode-erase').classList.remove('active');
                    playBeep(900, 0.1);
                }
            } else {
                logSystem(`Selected tool: ${selectedRadialTool.toUpperCase()}`);
                if (selectedRadialTool === 'eraser') {
                    activeMode = 'erase';
                    document.getElementById('btn-mode-erase').classList.add('active');
                    document.getElementById('btn-mode-draw').classList.remove('active');
                } else {
                    activeMode = 'draw';
                    document.getElementById('btn-mode-draw').classList.add('active');
                    document.getElementById('btn-mode-erase').classList.remove('active');
                    
                    document.getElementById('sel-brush').value = selectedRadialTool;
                    activeBrush = selectedRadialTool;
                    const magicThemes = ['celestial', 'plasma', 'ember', 'frost', 'sakura', 'quantum'];
                    if (magicThemes.includes(activeBrush)) {
                        cfgParticleTheme.value = activeBrush;
                    } else if (activeBrush === 'magic') {
                        cfgParticleTheme.value = 'celestial';
                    }
                }
                playBeep(900, 0.1);
            }
            closeRadialMenus();
            stableGesture = 'none';
        }

        function updateLabMeters(g) {
            document.querySelectorAll('.meter-bar-fill').forEach(f => f.style.width = '0%');
            if (g === 'pinch') document.getElementById('meter-pinch').style.width = '100%';
            else if (g === 'thumbs_up') document.getElementById('meter-thumbs-up').style.width = '100%';
            else if (g === 'thumbs_down') document.getElementById('meter-thumbs-down').style.width = '100%';
            else if (g === 'palm') document.getElementById('meter-palm').style.width = '100%';
            else if (g === 'fist') document.getElementById('meter-fist').style.width = '100%';
            else if (g === 'two_fingers') document.getElementById('meter-two-fingers').style.width = '100%';
        }

        // ------------------ VIRTUAL DRAWING & PAINTING ------------------
        function handleVirtualPinchDrag(x, y) {
            const paintRect = paintCanvas.getBoundingClientRect();
            const insideCanvasX = x;
            const insideCanvasY = y;

            if (insideCanvasX >= 0 && insideCanvasX <= paintCanvas.width &&
                insideCanvasY >= 0 && insideCanvasY <= paintCanvas.height) {
                
                if (!isDrawing) {
                    saveHistoryState();
                    isDrawing = true;
                    startX = insideCanvasX;
                    startY = insideCanvasY;
                    lastPaintX = insideCanvasX;
                    lastPaintY = insideCanvasY;
                    strokePoints = [];
                    
                    // Trigger sound & burst
                    playBeep(880, 0.08);
                    createParticlesBurst(insideCanvasX, insideCanvasY, 6);
                }

                // Add points trajectory
                strokePoints.push({ x: insideCanvasX, y: insideCanvasY });

                // Draw stroke
                paintCtx.save();
                paintCtx.lineWidth = brushSize;
                paintCtx.strokeStyle = activeColor;
                paintCtx.lineCap = 'round';
                paintCtx.lineJoin = 'round';

                if (activeMode === 'erase') {
                    paintCtx.globalCompositeOperation = 'destination-out';
                    paintCtx.lineWidth = brushSize * 18.0; 
                    
                    paintCtx.beginPath();
                    paintCtx.moveTo(lastPaintX, lastPaintY);
                    paintCtx.lineTo(insideCanvasX, insideCanvasY);
                    paintCtx.stroke();
                } else {
                    paintCtx.globalCompositeOperation = 'source-over';
                    
                    // Apply special neon brush properties
                    if (activeBrush === 'neon') {
                        paintCtx.shadowBlur = 10;
                        paintCtx.shadowColor = activeColor;
                    }
                    
                    paintCtx.beginPath();
                    paintCtx.moveTo(lastPaintX, lastPaintY);
                    paintCtx.lineTo(insideCanvasX, insideCanvasY);
                    paintCtx.stroke();
                }
                paintCtx.restore();

                // Save coordinate points to replay recorder
                recordedStrokes.push({
                    x: insideCanvasX,
                    y: insideCanvasY,
                    color: activeColor,
                    size: brushSize,
                    isStart: (strokePoints.length === 1)
                });
                
                // Generate magic particles!
                createParticlesBurst(insideCanvasX, insideCanvasY, 2);

                lastPaintX = insideCanvasX;
                lastPaintY = insideCanvasY;

            } else {
                if (isDrawing) {
                    isDrawing = false;
                    handleStrokeFinishEvent();
                }
            }
        }

        function handleStrokeFinishEvent() {
            // Check shape assist geometry heuristics
            const activeSelBrush = document.getElementById('sel-brush').value;
            if (activeSelBrush === 'shapes' && strokePoints.length > 10) {
                pendingShape = recognizeShapeHeuristics(strokePoints);
                if (pendingShape) {
                    // Display CAD Shape HUD
                    document.getElementById('shape-assist-hud').style.display = 'flex';
                    document.getElementById('shape-assist-text').innerHTML = `🔹 Corrected: ${pendingShape.type} (${pendingShape.confidence}% Match)`;
                    
                    // Draw shape assist preview lines
                    paintCtx.save();
                    paintCtx.strokeStyle = 'var(--secondary)';
                    paintCtx.lineWidth = brushSize;
                    paintCtx.setLineDash([6, 4]);
                    
                    drawTargetShape(paintCtx, pendingShape);
                    paintCtx.restore();
                    
                    logSystem(`Smart Assist: Proposed ${pendingShape.type} correction`);
                    playBeep(700, 0.1, 'sine');
                }
            }
            strokePoints = [];
        }

        function triggerVirtualCanvasCapture() {
            playCameraSound();
            logSystem("📸 Capturing Canvas snapshot...");

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 300;
            tempCanvas.height = 200;
            const ctx = tempCanvas.getContext('2d');

            // Draw clean dark background
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, 300, 200);

            // Draw border glowing ring
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, 300, 200);

            // Render drawing canvas
            ctx.drawImage(paintCanvas, 10, 10, 280, 180);

            const dataURL = tempCanvas.toDataURL();

            noCapturesText.style.display = 'none';

            const img = document.createElement('img');
            img.src = dataURL;
            img.className = 'gallery-thumbnail';
            img.title = "Click to download snapshot";
            img.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `aura_capture_${Math.floor(Date.now()/1000)}.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            
            galleryList.insertBefore(img, galleryList.firstChild);
        }

        // ------------------ MAIN RENDER TICK ENGINE ------------------
        function mainRenderLoop() {
            // Draw magic particles over drawing canvas
            // To do this clean, we clear paintCanvas only of drawing layer?
            // Actually, AURA separates logics. The particle layer can just draw over the canvas!
            // Wait, if the particles are drawn directly on paintCanvas, they will smear and stay!
            // To prevent smearing: on every frame, we clear the canvas visual particles?
            // Ah! The logic drawing itself is persistent. Drawing particles directly on the paintCanvas
            // would smudge and leave trails. To solve this:
            // We can draw particles directly on paintCtx with destination-over, or
            // simply let them draw and fade out. But since the canvas is NOT cleared, particles would stack up!
            // Yes! To avoid stacking up particles, we must redraw the persistent canvas drawing strokes,
            // or simply draw particles on a second overlay transparent canvas situated on top of the drawing canvas!
            // That is the standard double-buffered overlays method! It is extremely clean and guarantees
            // that the persistent drawing canvas remains 100% clean and pristine, while the floating particles,
            // cursors, and radial menu previews render at 60fps on the transparent overlay!
            // Let's check: do we have an overlay?
            // Wait, we can just overlay the particles visual on the paint canvas?
            // Yes! But instead of a separate canvas element, we can clear the paintCanvas and redraw history?
            // No, that is slow. An overlay canvas is perfect and takes 2 lines of CSS!
            // Let's see: we can overlay a transparent canvas `#particle-canvas` exactly over `#paint-canvas`!
            // Let's check if we can do it. Yes, we can just render the particles on a separate transparent layer!
            // But wait, the current HTML only has `#paint-canvas`. Can we draw the particles and fade them
            // using a semi-transparent clear rect on a temporary buffer?
            // Yes, if we don't have an overlay canvas, we can draw them and then let them decay. But since the background
            // is not cleared, they stay.
            // Let's implement the overlay canvas or let's double buffer using CSS!
            // Actually, we can dynamically insert the particle overlay canvas on load, or we can just draw the particles
            // and clear them by redrawing the drawings. But wait, we can also just create the particle canvas overlay:
            // In CSS, position both canvases absolute inside `#canvas-wrapper`!
            // Let's check:
            // ```css
            // #paint-canvas {
            //    position: absolute;
            //    top: 0; left: 0;
            //    z-index: 1;
            // }
            // #particle-canvas {
            //    position: absolute;
            //    top: 0; left: 0;
            //    z-index: 2;
            //    pointer-events: none;
            // }
            // ```
            // This is **incredibly clean** and guarantees that:
            // 1. The persistent drawing canvas remains 100% clean and untouched.
            // 2. The particle trails, cursors, and selections render at 60fps on the transparent `#particle-canvas`.
            // Let's add this! Let's write the CSS and HTML support for `#particle-canvas` overlay dynamically!
            
            // For now, let's create the `#particle-canvas` dynamically on load:
            const particleCanvas = document.createElement('canvas');
            particleCanvas.id = 'particle-canvas';
            particleCanvas.style.position = 'absolute';
            particleCanvas.style.top = '0';
            particleCanvas.style.left = '0';
            particleCanvas.style.width = '100%';
            particleCanvas.style.height = '100%';
            particleCanvas.style.pointerEvents = 'none';
            particleCanvas.style.zIndex = '5';
            
            // Set paint canvas to absolute too
            paintCanvas.style.position = 'absolute';
            paintCanvas.style.top = '0';
            paintCanvas.style.left = '0';
            paintCanvas.style.width = '100%';
            paintCanvas.style.height = '100%';
            paintCanvas.style.zIndex = '1';
            
            paintCanvas.parentNode.appendChild(particleCanvas);
            const pCtx = particleCanvas.getContext('2d');

            function resizeParticleCanvas() {
                particleCanvas.width = particleCanvas.offsetWidth;
                particleCanvas.height = particleCanvas.offsetHeight;
            }
            window.addEventListener('resize', resizeParticleCanvas);
            resizeParticleCanvas();

            // RENDER LOOP TICK
            let prevSmoothX = 0;
            let prevSmoothY = 0;
            function tick() {
                pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
                
                // Update and draw active particles
                let activeCount = 0;
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    if (p.active) {
                        p.update(16);
                        if (p.active) {
                            p.draw(pCtx);
                            activeCount++;
                        }
                    }
                }
                const metricParticles = document.getElementById('metric-particles');
                if (metricParticles) {
                    metricParticles.innerHTML = activeCount;
                }
                
                // Draw virtual cursor trace indicator on particle canvas with advanced states
                if (isHandDetected) {
                    pCtx.save();
                    
                    let cursorState = 'IDLE';
                    const dx = smoothX - prevSmoothX;
                    const dy = smoothY - prevSmoothY;
                    const velocity = Math.hypot(dx, dy);
                    prevSmoothX = smoothX;
                    prevSmoothY = smoothY;

                    if (stableGesture === 'palm') {
                        cursorState = 'PAUSED';
                    } else if (isCommandMenuOpen || isToolMenuOpen) {
                        cursorState = 'COMMAND';
                    } else if (isDrawing) {
                        cursorState = 'DRAWING';
                    } else if (velocity > 15) {
                        cursorState = 'FAST MOVEMENT';
                    } else if (velocity > 0.8) {
                        cursorState = 'MOVING';
                    } else {
                        cursorState = 'IDLE';
                    }

                    // Update HUD cursor state telemetry value
                    const hudCursorState = document.getElementById('metric-track');
                    if (hudCursorState) {
                        hudCursorState.innerHTML = cursorState;
                    }

                    if (cursorState === 'PAUSED') {
                        pCtx.fillStyle = 'rgba(156, 163, 175, 0.5)';
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, 4, 0, Math.PI * 2);
                        pCtx.fill();
                    } else if (cursorState === 'COMMAND') {
                        pCtx.strokeStyle = 'var(--secondary)';
                        pCtx.lineWidth = 2;
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, 8, 0, Math.PI * 2);
                        pCtx.stroke();
                        pCtx.beginPath();
                        pCtx.moveTo(smoothX - 12, smoothY);
                        pCtx.lineTo(smoothX + 12, smoothY);
                        pCtx.moveTo(smoothX, smoothY - 12);
                        pCtx.lineTo(smoothX, smoothY + 12);
                        pCtx.stroke();
                    } else if (cursorState === 'DRAWING') {
                        const pulse = 10 + Math.sin(Date.now() / 100) * 3;
                        pCtx.shadowBlur = pulse;
                        pCtx.shadowColor = 'var(--accent)';
                        pCtx.fillStyle = '#ffffff';
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, 5, 0, Math.PI * 2);
                        pCtx.fill();
                        pCtx.strokeStyle = 'var(--accent)';
                        pCtx.lineWidth = 2;
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, pulse, 0, Math.PI * 2);
                        pCtx.stroke();
                    } else if (cursorState === 'FAST MOVEMENT') {
                        pCtx.shadowBlur = 15;
                        pCtx.shadowColor = 'var(--secondary)';
                        pCtx.fillStyle = '#ffffff';
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, 6, 0, Math.PI * 2);
                        pCtx.fill();
                        pCtx.fillStyle = 'var(--secondary)';
                        pCtx.font = '14px serif';
                        pCtx.fillText('✨', smoothX - dx * 0.8, smoothY - dy * 0.8);
                    } else {
                        const time = Date.now() * 0.003;
                        pCtx.shadowBlur = 12;
                        pCtx.shadowColor = 'var(--primary)';
                        
                        pCtx.fillStyle = '#ffffff';
                        pCtx.beginPath();
                        pCtx.arc(smoothX, smoothY, 4, 0, Math.PI * 2);
                        pCtx.fill();
                        
                        pCtx.fillStyle = 'var(--accent)';
                        pCtx.font = '12px serif';
                        const offset1X = Math.cos(time) * 12;
                        const offset1Y = Math.sin(time) * 12;
                        const offset2X = Math.cos(time + Math.PI) * 14;
                        const offset2Y = Math.sin(time + Math.PI) * 14;
                        pCtx.fillText('✦', smoothX + offset1X, smoothY + offset1Y);
                        pCtx.fillText('✧', smoothX + offset2X, smoothY + offset2Y);
                        pCtx.fillText('✨', smoothX - offset1X * 0.5, smoothY - offset1Y * 0.5);
                    }
                    
                    pCtx.restore();
                }
                
                requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }
        window.addEventListener('load', () => {
            setTimeout(mainRenderLoop, 300);
        });

        // Initialize MediaPipe Hands Object
        const hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});

        let frameStartTimestamp = 0;
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.70,
            minTrackingConfidence: 0.70
        });
        hands.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                frameStartTimestamp = performance.now();
                await hands.send({image: videoElement});
            },
            width: 640,
            height: 480
        });

        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                videoElement.srcObject = stream;
                videoElement.play();
                camera.start();
                logSystem("Webcam tracking initialized successfully");
            })
            .catch(err => {
                console.error("Camera access error:", err);
                camHudStatus.innerHTML = "ERROR: ACCESS BLOCKED";
                camHudStatus.style.color = "var(--danger)";
                logSystem("Camera permission blocked.");
            });

        // Run initial update Calibration once loaded
        setTimeout(updateCalibrationSettings, 200);