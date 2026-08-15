import cv2
import mediapipe as mp
import pyautogui
import time
import math
import json
import os
import sys

# Set PyAutoGUI configuration for low latency
pyautogui.PAUSE = 0.0  # Remove the default 0.1s pause after actions
pyautogui.FAILSAFE = False  # Prevent script from crashing when mouse hits corners

DEFAULT_CONFIG = {
    "webcam_index": 0,
    "min_detection_confidence": 0.7,
    "min_tracking_confidence": 0.7,
    "click_threshold": 0.05,        # Normalized distance between thumb and index tips
    "click_cooldown": 0.5,           # Seconds between clicks
    "double_click_threshold": 0.4,   # Seconds to recognize double click
    "scroll_cooldown": 0.15,         # Seconds between scrolls
    "screenshot_cooldown": 2.0,      # Seconds between screenshots
    "smoothing": 0.25,               # Cursor smoothing (0.1 = very smooth/laggy, 1.0 = instant/jittery)
    "active_area_left": 0.15,        # Bounding box coordinates for mouse tracking
    "active_area_right": 0.85,       # (helps reach screen edges easily)
    "active_area_top": 0.15,
    "active_area_bottom": 0.75
}

CONFIG_FILE = "config.json"

def load_config():
    """Load configuration from file or create default if not exists."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
                # Merge with default to ensure all keys exist
                for k, v in DEFAULT_CONFIG.items():
                    if k not in config:
                        config[k] = v
                return config
        except Exception as e:
            print(f"Error loading config.json, using defaults: {e}")
            return DEFAULT_CONFIG
    else:
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
            print("Created default config.json")
        except Exception as e:
            print(f"Could not save default config.json: {e}")
        return DEFAULT_CONFIG

def main():
    config = load_config()
    
    print("\n==============================================")
    print("        Smart Hand Gesture Control System      ")
    print("==============================================")
    print("Press 'q' in the live video window to exit.")
    print("Current Configuration loaded:")
    for k, v in config.items():
        print(f"  {k}: {v}")
    print("==============================================\n")

    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    hands = mp_hands.Hands(
        max_num_hands=1,
        min_detection_confidence=config["min_detection_confidence"],
        min_tracking_confidence=config["min_tracking_confidence"]
    )

    # Initialize Webcam
    webcam_idx = int(config["webcam_index"])
    cap = cv2.VideoCapture(webcam_idx)
    
    if not cap.isOpened():
        print(f"Error: Cannot open camera with index {webcam_idx}.")
        print("Please check connection or modify config.json's 'webcam_index'.")
        sys.exit(1)

    # State variables
    click_times = []
    freeze_cursor = False
    last_screenshot_time = 0.0
    last_scroll_time = 0.0
    
    screen_w, screen_h = pyautogui.size()
    prev_screen_x, prev_screen_y = screen_w // 2, screen_h // 2
    
    # Create screenshots directory if it doesn't exist
    if not os.path.exists("screenshots"):
        os.makedirs("screenshots")
        print("Created screenshots/ directory")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Can't receive frame from camera. Exiting...")
            break

        # Flip the image horizontally for natural mirroring
        frame = cv2.flip(frame, 1)
        h_img, w_img, _ = frame.shape
        
        # Draw active tracking region box on OpenCV window
        x1_box = int(config["active_area_left"] * w_img)
        y1_box = int(config["active_area_top"] * h_img)
        x2_box = int(config["active_area_right"] * w_img)
        y2_box = int(config["active_area_bottom"] * h_img)
        cv2.rectangle(frame, (x1_box, y1_box), (x2_box, y2_box), (255, 100, 0), 2)
        cv2.putText(frame, "Active Tracking Area", (x1_box, y1_box - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)

        # Process landmarks
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb)
        
        gesture_detected = "None"
        
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)
                )

                # Get key fingertip coordinates
                thumb_tip = hand_landmarks.landmark[4]
                index_tip = hand_landmarks.landmark[8]
                middle_tip = hand_landmarks.landmark[12]
                ring_tip = hand_landmarks.landmark[16]
                pinky_tip = hand_landmarks.landmark[20]

                # Heuristic for extended fingers: tip is above the pip joint (tip - 2)
                # Tips: Index=8, Middle=12, Ring=16, Pinky=20
                fingers = [
                    1 if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y else 0
                    for tip in [8, 12, 16, 20]
                ]

                # Distance between thumb tip and index tip (Euclidean)
                dist = math.hypot(thumb_tip.x - index_tip.x, thumb_tip.y - index_tip.y)
                
                # Check for Click gesture (Pinch thumb + index)
                if dist < config["click_threshold"]:
                    if not freeze_cursor:
                        freeze_cursor = True
                        current_time = time.time()
                        click_times.append(current_time)

                        # Check for Double Click
                        if len(click_times) >= 2 and (click_times[-1] - click_times[-2] < config["double_click_threshold"]):
                            try:
                                pyautogui.doubleClick()
                                gesture_detected = "Double Click"
                            except Exception as e:
                                print(f"PyAutoGUI error: {e}")
                            click_times = []
                        # Single Click
                        else:
                            try:
                                pyautogui.click()
                                gesture_detected = "Single Click"
                            except Exception as e:
                                print(f"PyAutoGUI error: {e}")
                else:
                    freeze_cursor = False

                # Cursor movement using Index Finger Tip
                if not freeze_cursor:
                    # Map coordinates from the Active Region box to the full screen resolution
                    norm_x = (index_tip.x - config["active_area_left"]) / (config["active_area_right"] - config["active_area_left"])
                    norm_y = (index_tip.y - config["active_area_top"]) / (config["active_area_bottom"] - config["active_area_top"])
                    
                    # Clamp values to [0, 1] range
                    norm_x = max(0.0, min(1.0, norm_x))
                    norm_y = max(0.0, min(1.0, norm_y))
                    
                    # Compute target screen pixel coordinates
                    target_x = int(norm_x * screen_w)
                    target_y = int(norm_y * screen_h)
                    
                    # Apply Exponential Moving Average (EMA) smoothing to reduce jitter
                    alpha = config["smoothing"]
                    screen_x = int(prev_screen_x + alpha * (target_x - prev_screen_x))
                    screen_y = int(prev_screen_y + alpha * (target_y - prev_screen_y))
                    
                    try:
                        pyautogui.moveTo(screen_x, screen_y)
                    except Exception as e:
                        # Catch FailSafeException or display boundary limits
                        pass
                    
                    prev_screen_x, prev_screen_y = screen_x, screen_y
                    gesture_detected = f"Move: ({screen_x}, {screen_y})"

                # Scrolling Gesture: Four fingers fully extended
                if sum(fingers) == 4:
                    current_time = time.time()
                    if current_time - last_scroll_time > config["scroll_cooldown"]:
                        # Scroll up if index finger is in upper part of screen, down if in lower
                        if index_tip.y < 0.4:
                            pyautogui.scroll(120)
                            gesture_detected = "Scroll Up"
                        elif index_tip.y > 0.6:
                            pyautogui.scroll(-120)
                            gesture_detected = "Scroll Down"
                        last_scroll_time = current_time

                # Screenshot Gesture: All fingers closed (fist)
                if sum(fingers) == 0 and not freeze_cursor:
                    current_time = time.time()
                    if current_time - last_screenshot_time > config["screenshot_cooldown"]:
                        try:
                            filename = f"screenshots/screenshot_{int(current_time)}.png"
                            pyautogui.screenshot(filename)
                            print(f"Screenshot saved to: {filename}")
                            gesture_detected = "Screenshot Captured!"
                        except Exception as e:
                            print(f"Screenshot error: {e}")
                        last_screenshot_time = current_time

        # Render status texts on screen
        cv2.putText(frame, f"Gesture: {gesture_detected}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        # Help HUD
        cv2.rectangle(frame, (10, h_img - 90), (280, h_img - 10), (0, 0, 0), -1)
        cv2.putText(frame, "HUD Controls:", (20, h_img - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        cv2.putText(frame, "Pinch index+thumb = Click", (20, h_img - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.putText(frame, "4 Fingers up = Scroll (Index Y coordinate)", (20, h_img - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.putText(frame, "Closed Fist = Take Screenshot", (20, h_img - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # Show cv2 frame
        cv2.imshow("Smart Hand Gesture Control - Press 'q' to Exit", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    print("Application closed successfully.")

if __name__ == "__main__":
    main()
