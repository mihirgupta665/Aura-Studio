function recognizeShapeHeuristics(points) {
            if (points.length < 12) return null;
            
            // Bounds
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });

            const w = maxX - minX;
            const h = maxY - minY;
            const cx = minX + w/2;
            const cy = minY + h/2;

            // Compute perimeter path distance
            let perimeter = 0;
            for (let i = 1; i < points.length; i++) {
                perimeter += Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
            }

            const startPt = points[0];
            const endPt = points[points.length - 1];
            const closureDistance = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
            const isClosed = closureDistance < (0.24 * perimeter);

            // Straight Line Check
            let lineDeviation = 0;
            points.forEach(p => {
                const num = Math.abs((endPt.y - startPt.y)*p.x - (endPt.x - startPt.x)*p.y + endPt.x*startPt.y - endPt.y*startPt.x);
                const den = Math.hypot(endPt.y - startPt.y, endPt.x - startPt.x);
                if (den > 0) lineDeviation += (num / den);
            });
            const meanLineDeviation = lineDeviation / points.length;

            if (meanLineDeviation < 6.0 && !isClosed) {
                // Check for Arrow (has a sharp return/arrowhead)
                const arrowLength = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
                if (perimeter > arrowLength * 1.35) {
                    return { type: 'Arrow', confidence: 88, params: { x1: startPt.x, y1: startPt.y, x2: endPt.x, y2: endPt.y } };
                }
                return { type: 'Line', confidence: 96, params: { x1: startPt.x, y1: startPt.y, x2: endPt.x, y2: endPt.y } };
            }

            // Closed Shape Diagnostics
            if (isClosed) {
                let distSum = 0;
                points.forEach(p => {
                    distSum += Math.hypot(p.x - cx, p.y - cy);
                });
                const meanRadius = distSum / points.length;

                let variance = 0;
                points.forEach(p => {
                    const d = Math.hypot(p.x - cx, p.y - cy);
                    variance += Math.pow(d - meanRadius, 2);
                });
                const stdDev = Math.sqrt(variance / points.length);
                const ratio = stdDev / meanRadius;

                // 1. Circle
                if (ratio < 0.14) {
                    return { type: 'Circle', confidence: 94, params: { cx, cy, r: meanRadius } };
                }
                
                // 2. Ellipse
                if (ratio >= 0.14 && ratio < 0.24) {
                    const rx = w / 2;
                    const ry = h / 2;
                    return { type: 'Ellipse', confidence: 90, params: { cx, cy, rx, ry } };
                }

                // 3. Star (high variance in centroid distance)
                if (ratio >= 0.28) {
                    return { type: 'Star', confidence: 82, params: { cx, cy, r: meanRadius } };
                }

                // 4. Triangle (top area narrow compared to bottom)
                let topPoints = 0, bottomPoints = 0;
                points.forEach(p => {
                    if (p.y < minY + h * 0.3) topPoints++;
                    if (p.y > minY + h * 0.7) bottomPoints++;
                });
                if (bottomPoints > topPoints * 1.4) {
                    return { type: 'Triangle', confidence: 86, params: { x1: cx, y1: minY, x2: minX, y2: maxY, x3: maxX, y3: maxY } };
                }

                // 5. Rectangle
                return { type: 'Rectangle', confidence: 85, params: { x: minX, y: minY, w, h } };
            }

            return null;
        }

        // Shape confirmation event listeners
        document.getElementById('btn-shape-ok').addEventListener('click', () => {
            if (pendingShape) {
                commitPendingShape(true);
            }
        });

        document.getElementById('btn-shape-cancel').addEventListener('click', () => {
            if (pendingShape) {
                commitPendingShape(false);
            }
        });

        // Common canvas shape drawing helper
        function drawTargetShape(ctx, shape) {
            ctx.beginPath();
            if (shape.type === 'Line') {
                ctx.moveTo(shape.params.x1, shape.params.y1);
                ctx.lineTo(shape.params.x2, shape.params.y2);
                ctx.stroke();
            } else if (shape.type === 'Circle') {
                ctx.arc(shape.params.cx, shape.params.cy, shape.params.r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (shape.type === 'Rectangle') {
                ctx.strokeRect(shape.params.x, shape.params.y, shape.params.w, shape.params.h);
            } else if (shape.type === 'Ellipse') {
                ctx.ellipse(shape.params.cx, shape.params.cy, shape.params.rx, shape.params.ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            } else if (shape.type === 'Triangle') {
                ctx.moveTo(shape.params.x1, shape.params.y1);
                ctx.lineTo(shape.params.x2, shape.params.y2);
                ctx.lineTo(shape.params.x3, shape.params.y3);
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === 'Star') {
                const cx = shape.params.cx;
                const cy = shape.params.cy;
                const r = shape.params.r;
                const spikes = 5;
                let rot = Math.PI / 2 * 3;
                let x = cx;
                let y = cy;
                const step = Math.PI / spikes;

                ctx.moveTo(cx, cy - r);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * r;
                    y = cy + Math.sin(rot) * r;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = cx + Math.cos(rot) * (r * 0.4);
                    y = cy + Math.sin(rot) * (r * 0.4);
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === 'Arrow') {
                const x1 = shape.params.x1;
                const y1 = shape.params.y1;
                const x2 = shape.params.x2;
                const y2 = shape.params.y2;
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLength = 15;
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        }

        function commitPendingShape(accept) {
            // Restore original drawing canvas background state first
            if (drawingHistory.length > 0) {
                paintCtx.putImageData(drawingHistory[drawingHistory.length - 1], 0, 0);
            }
            
            if (accept && pendingShape) {
                paintCtx.save();
                paintCtx.lineWidth = brushSize;
                paintCtx.strokeStyle = activeColor;
                paintCtx.lineCap = 'round';
                paintCtx.lineJoin = 'round';
                
                if (activeBrush === 'neon') {
                    paintCtx.shadowBlur = 10;
                    paintCtx.shadowColor = activeColor;
                }
                
                drawTargetShape(paintCtx, pendingShape);
                paintCtx.restore();
                
                // Visual spark confirmation burst
                const cx = pendingShape.params.cx || pendingShape.params.x1 || pendingShape.params.x || (paintCanvas.width / 2);
                const cy = pendingShape.params.cy || pendingShape.params.y1 || pendingShape.params.y || (paintCanvas.height / 2);
                createParticlesBurst(cx, cy, 25);
                logSystem(`Confirmed corrected shape: ${pendingShape.type}`);
                playBeep(900, 0.12, 'sine');
            } else {
                logSystem("Discarded shape correction");
                playBeep(350, 0.08, 'sawtooth');
            }

            pendingShape = null;
            document.getElementById('shape-assist-hud').style.display = 'none';
        }