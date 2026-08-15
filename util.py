import numpy as np

def get_angle(a, b, c):
    """
    Calculate the angle between three points a, b, and c, with b being the vertex.
    Each point should be a list or tuple of (x, y) coordinates.
    Returns the angle in degrees in the range [0, 360].
    """
    try:
        # Use arctan2 to handle quadrants and avoid division by zero
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        if angle > 180.0:
            angle = 360.0 - angle
        return angle
    except Exception as e:
        print(f"Error calculating angle: {e}")
        return 0.0

def get_distance(landmark_list):
    """
    Calculate Euclidean distance between two points in a list.
    Interpolates the distance from a normalized [0, 1] range to [0, 1000] for easier threshold comparisons.
    """
    if len(landmark_list) < 2:
        return 0.0
    
    try:
        (x1, y1), (x2, y2) = landmark_list[0], landmark_list[1]
        l = np.hypot(x2 - x1, y2 - y1)
        # Fix the syntax error from original code [0,1][0,1000] to proper interp arguments
        return float(np.interp(l, [0.0, 1.0], [0.0, 1000.0]))
    except Exception as e:
        print(f"Error calculating distance: {e}")
        return 0.0