// ------------------ GESTURE DETECTION STATE MACHINE ------------------
        let rawGesture = 'none';
        let prevRawGesture = 'none';
        let stableGesture = 'none';
        let gestureTimer = 0;
        const STABILITY_FRAMES_THRESHOLD = 6;
        let lastGestureTimestamp = 0;
        const GESTURE_COOLDOWN_MS = 300; 

        // Per-gesture state tracking to prevent duplicate triggers
        const gestureStates = {
            pinch: { name: 'pinch', stable: false, frames: 0 },
            thumbs_up: { name: 'thumbs_up', stable: false, frames: 0 },
            thumbs_down: { name: 'thumbs_down', stable: false, frames: 0 },
            palm: { name: 'palm', stable: false, frames: 0 },
            fist: { name: 'fist', stable: false, frames: 0 },
            two_fingers: { name: 'two_fingers', stable: false, frames: 0 }
        };

        // Fist Countdown variables
        let isFistCountdown = false;
        let fistTimerStart = 0;
        const FIST_SCREENSHOT_HOLD_MS = 1500;

        // Command Mode radial parameters
        let isCommandMenuOpen = false;
        let isToolMenuOpen = false;
        const fistMenu = document.getElementById('fist-menu-overlay');
        const toolMenu = document.getElementById('tool-menu-overlay');
        let selectedRadialCommand = 'none';
        let selectedRadialTool = 'none';

        // Two-hand zooming / panning parameters
        let canvasZoom = 1.0;
        let canvasPanX = 0;
        let canvasPanY = 0;
        let prevTwoHandDist = null;
        let prevTwoHandMid = null;

function handleGestureRelease(gesture) {
            logSystem(`Gesture released: ${gesture.toUpperCase()}`);
            if (gesture === 'palm') {
                trackingPausedOverlay.style.display = 'none';
            }
            
            // Release fist to execute command
            if (gesture === 'fist') {
                if (isCommandMenuOpen) {
                    if (selectedRadialCommand !== 'none') {
                        executeRadialAction('command');
                    }
                    closeRadialMenus();
                }
            }
            
            // Release two_fingers to execute tool selection
            if (gesture === 'two_fingers') {
                if (isToolMenuOpen) {
                    if (selectedRadialTool !== 'none') {
                        executeRadialAction('tool');
                    }
                    closeRadialMenus();
                }
            }
        }

        function handleGestureEventTrigger(gesture) {
            totalGestures++;
            document.getElementById('stat-gestures').innerHTML = totalGestures;
            
            logSystem(`Gesture recognized: ${gesture.toUpperCase()}`);

            // Thumbs Down -> Undo stroke
            if (gesture === 'thumbs_down') {
                if (pendingShape) {
                    commitPendingShape(false);
                } else {
                    undoLastAction();
                }
            }

            // Thumbs Up -> Confirm shape assist or radial commands
            if (gesture === 'thumbs_up') {
                if (pendingShape) {
                    commitPendingShape(true);
                } else if (isCommandMenuOpen) {
                    executeRadialAction('command');
                } else if (isToolMenuOpen) {
                    executeRadialAction('tool');
                }
            }

            // Fist -> Open Command Menu overlay
            if (gesture === 'fist' && !isFistCountdown) {
                openRadialMenu(fistMenu, 'command');
            }

            // Two-Fingers -> Open Brushes selector
            if (gesture === 'two_fingers') {
                openRadialMenu(toolMenu, 'tool');
            }

            // Palm -> Close any menus & Pause drawing
            if (gesture === 'palm') {
                closeRadialMenus();
                isDrawing = false;
                trackingPausedOverlay.style.display = 'flex';
                logSystem("Spatial tracking paused");
                playBeep(220, 0.12, 'sawtooth');
            }
        }