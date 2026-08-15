// Guided Auto-Calibration Step Engine
        function runAutoCalibrationStep(results) {
            if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
                autoCalStatus.innerHTML = "No hand detected. Show hand to webcam.";
                autoCalStatus.style.color = "var(--danger)";
                autoCalProgressFill.style.width = '0%';
                return;
            }
            
            autoCalStatus.style.color = "var(--secondary)";
            const landmarks = results.multiHandLandmarks[0];
            const handScale = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            const dist4_8 = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

            const isIndexExtended = landmarks[8].y < landmarks[6].y;
            const isMiddleExtended = landmarks[12].y < landmarks[10].y;
            const isRingExtended = landmarks[16].y < landmarks[14].y;
            const isPinkyExtended = landmarks[20].y < landmarks[18].y;
            const extendedCount = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

            calFrames++;
            const pct = Math.min(100, Math.floor((calFrames / 30) * 100));

            if (calStage === 1) {
                autoCalTitle.innerHTML = 'STAGE 1: OPEN PALM';
                autoCalInstructions.innerHTML = 'Hold your open hand clearly in front of the camera.';
                autoCalProgressFill.style.width = `${pct}%`;
                
                if (extendedCount >= 3) {
                    calData.openDists.push(handScale);
                    autoCalStatus.innerHTML = `Calibrating hand scale... (${pct}%)`;
                    if (calFrames >= 30) {
                        playBeep(600, 0.05);
                        calStage = 2;
                        calFrames = 0;
                    }
                } else {
                    calFrames = Math.max(0, calFrames - 2);
                    autoCalStatus.innerHTML = "Open palm not fully extended.";
                }
            } else if (calStage === 2) {
                autoCalTitle.innerHTML = 'STAGE 2: HOVER POINTER';
                autoCalInstructions.innerHTML = 'Extend only your index finger. Keep other fingers closed.';
                autoCalProgressFill.style.width = `${pct}%`;
                
                if (isIndexExtended && extendedCount === 1) {
                    autoCalStatus.innerHTML = `Stabilizing index pointer... (${pct}%)`;
                    if (calFrames >= 30) {
                        playBeep(700, 0.05);
                        calStage = 3;
                        calFrames = 0;
                    }
                } else {
                    calFrames = Math.max(0, calFrames - 2);
                    autoCalStatus.innerHTML = "Extend only your index finger.";
                }
            } else if (calStage === 3) {
                autoCalTitle.innerHTML = 'STAGE 3: PINCH TO DRAW';
                autoCalInstructions.innerHTML = 'Pinch index finger and thumb together firmly.';
                autoCalProgressFill.style.width = `${pct}%`;
                
                if (dist4_8 / handScale < 0.28) {
                    calData.pinchDists.push(dist4_8);
                    autoCalStatus.innerHTML = `Measuring pinch threshold... (${pct}%)`;
                    if (calFrames >= 30) {
                        playBeep(800, 0.05);
                        calStage = 4;
                        calFrames = 0;
                    }
                } else {
                    calFrames = Math.max(0, calFrames - 2);
                    autoCalStatus.innerHTML = "Pinch thumb and index fingertip together.";
                }
            } else if (calStage === 4) {
                autoCalTitle.innerHTML = 'STAGE 4: CLOSED FIST';
                autoCalInstructions.innerHTML = 'Close your hand into a tight fist.';
                autoCalProgressFill.style.width = `${pct}%`;
                
                if (extendedCount === 0) {
                    autoCalStatus.innerHTML = `Calibrating fist size... (${pct}%)`;
                    if (calFrames >= 30) {
                        playBeep(900, 0.05);
                        calStage = 5;
                        calFrames = 0;
                    }
                } else {
                    calFrames = Math.max(0, calFrames - 2);
                    autoCalStatus.innerHTML = "Close all fingers to form a fist.";
                }
            } else if (calStage === 5) {
                autoCalTitle.innerHTML = 'STAGE 5: SCAN RANGE';
                autoCalInstructions.innerHTML = 'Move index finger comfort boundaries (corners of camera frame).';
                
                const totalScanFrames = 120;
                const scanPct = Math.min(100, Math.floor((calFrames / totalScanFrames) * 100));
                autoCalProgressFill.style.width = `${scanPct}%`;
                autoCalStatus.innerHTML = `Scanning boundaries... (${scanPct}%)`;

                calData.minX = Math.min(calData.minX, indexTip.x);
                calData.maxX = Math.max(calData.maxX, indexTip.x);
                calData.minY = Math.min(calData.minY, indexTip.y);
                calData.maxY = Math.max(calData.maxY, indexTip.y);

                if (calFrames >= totalScanFrames) {
                    const widthMargin = (calData.maxX - calData.minX) * 0.03;
                    const heightMargin = (calData.maxY - calData.minY) * 0.03;
                    
                    const finalLeft = Math.max(0.0, calData.minX + widthMargin);
                    const finalRight = Math.min(1.0, calData.maxX - widthMargin);
                    const finalTop = Math.max(0.0, calData.minY + heightMargin);
                    const finalBottom = Math.min(1.0, calData.maxY - heightMargin);

                    const avgPinchDist = calData.pinchDists.reduce((a,b)=>a+b, 0) / calData.pinchDists.length;
                    const finalPinch = Math.max(0.08, Math.min(0.28, (avgPinchDist / handScale) * 1.35));

                    // Apply to sliders
                    cfgBoxLeft.value = finalLeft.toFixed(2);
                    cfgBoxRight.value = finalRight.toFixed(2);
                    cfgBoxTop.value = finalTop.toFixed(2);
                    cfgBoxBottom.value = finalBottom.toFixed(2);
                    cfgPinch.value = finalPinch.toFixed(2);
                    cfgSmoothing.value = "0.20"; 

                    updateCalibrationSettings();
                    playBeep(950, 0.15, 'sine');
                    logSystem("Guided Auto-Calibration complete!");
                    
                    autoCalTitle.innerHTML = 'CALIBRATION COMPLETE';
                    autoCalInstructions.innerHTML = 'Recommended drawing settings have been applied successfully.';
                    autoCalStatus.innerHTML = 'Wizard complete!';
                    autoCalStatus.style.color = "var(--success)";
                    autoCalProgressFill.style.width = '100%';

                    setTimeout(() => {
                        autoCalOverlay.style.display = 'none';
                        isCalibrating = false;
                    }, 2000);
                }
            }
        }