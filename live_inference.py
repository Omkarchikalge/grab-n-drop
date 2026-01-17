import cv2
import numpy as np
from collections import deque
from tensorflow.keras.models import load_model
import time

from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    HandLandmarker,
    HandLandmarkerOptions,
    RunningMode
)

# ================= CONFIG =================
WINDOW_SIZE = 30
CONF_THRESHOLD = 0.8
LABELS = ["drop", "grab"]
gesture_state = "IDLE"  # IDLE -> HOLDING
last_gesture_time = 0
COOLDOWN_TIME = 1.2

# ================= LOAD MODEL =================
model = load_model("gesture_model.h5")

# ================= MEDIAPIPE =================
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=RunningMode.VIDEO,
    num_hands=1
)
landmarker = HandLandmarker.create_from_options(options)

# ================= BUFFER =================
sequence = deque(maxlen=WINDOW_SIZE)

def normalize_landmarks(raw):
    landmarks = np.array(raw).reshape(21, 3)
    wrist = landmarks[0]
    landmarks -= wrist
    scale = np.linalg.norm(landmarks[9])
    if scale > 0:
        landmarks /= scale
    return landmarks.flatten()

# ================= CAMERA =================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
timestamp_ms = 0

print("Live inference started — press ESC to exit")

def hand_openness(landmarks):
    # Average distance of fingertips from wrist
    wrist = landmarks[0]
    tips = [4, 8, 12, 16, 20]

    dists = [
        np.linalg.norm(np.array(landmarks[i]) - np.array(wrist))
        for i in tips
    ]
    return np.mean(dists)


while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = Image(
        image_format=ImageFormat.SRGB,
        data=rgb
    )

    timestamp_ms += 33
    result = landmarker.detect_for_video(mp_image, timestamp_ms)

    if result.hand_landmarks:
        hand = result.hand_landmarks[0]
        raw = []
        for lm in hand:
            raw.extend([lm.x, lm.y, lm.z])

        sequence.append(normalize_landmarks(raw))

        current_time = time.time()

        if len(sequence) == WINDOW_SIZE:
            X = np.expand_dims(sequence, axis=0)
            probs = model.predict(X, verbose=0)[0]

            idx = np.argmax(probs)
            conf = probs[idx]

            if conf > CONF_THRESHOLD and (current_time - last_gesture_time) > COOLDOWN_TIME:
                predicted = LABELS[idx].upper()

                if predicted == "GRAB" and gesture_state == "IDLE":
                    print("GRAB", flush=True)
                    gesture_state = "HOLDING"
                    last_gesture_time = current_time

                elif predicted == "DROP" and gesture_state == "HOLDING":
                    print("DROP", flush=True)
                    gesture_state = "IDLE"
                    last_gesture_time = current_time


    cv2.imshow("Grab-Drop Live", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
