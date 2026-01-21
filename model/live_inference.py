import cv2
import numpy as np
from collections import deque
from tensorflow.keras.models import load_model
import time
import websocket
import json

from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    HandLandmarker,
    HandLandmarkerOptions,
    RunningMode
)

# ================= CONFIG =================
WS_SERVER_URL = "ws://192.168.0.162:3000"

WINDOW_SIZE = 30
LABELS = ["grab", "drop"]

GRAB_CONF = 0.55
DROP_CONF = 0.75

GRAB_OPEN_MAX = 0.35   # closed hand
DROP_OPEN_MIN = 0.40   # open hand

gesture_state = "IDLE"  # IDLE -> HOLDING
last_gesture_time = 0
COOLDOWN_TIME = 1.0



ROOM_ID = "demo-room"

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

def hand_openness(landmarks):
    wrist = landmarks[0]
    wrist_xyz = np.array([wrist.x, wrist.y, wrist.z])

    tips = [4, 8, 12, 16, 20]
    distances = []

    for i in tips:
        tip = landmarks[i]
        tip_xyz = np.array([tip.x, tip.y, tip.z])
        distances.append(np.linalg.norm(tip_xyz - wrist_xyz))

    return np.mean(distances)

# ================= CAMERA =================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
timestamp_ms = 0

print("Live inference started — press ESC to exit")

# ================= WEBSOCKET =================
ws = websocket.WebSocket()
ws.connect(WS_SERVER_URL) 
print(f" Connected to WebSocket server at {WS_SERVER_URL}")
print("Connected to WebSocket server")

ws.send(json.dumps({
    "type": "join-room",
    "roomId": ROOM_ID
}))

# ================= MAIN LOOP =================
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
        openness = hand_openness(hand)
        current_time = time.time()

        if len(sequence) == WINDOW_SIZE:
            X = np.expand_dims(sequence, axis=0)
            probs = model.predict(X, verbose=0)[0]

            idx = np.argmax(probs)
            conf = probs[idx]
            predicted = LABELS[idx].upper()

            # print(
            #     f"{predicted} | conf={conf:.2f} | open={openness:.2f} | state={gesture_state}",
            #     flush=True
            # )

            if (current_time - last_gesture_time) > COOLDOWN_TIME:

                # -------- GRAB --------
                if (
                    predicted == "GRAB"
                    and gesture_state == "IDLE"
                    and conf > GRAB_CONF
                    and openness < GRAB_OPEN_MAX
                    ):
                    gesture_state = "HOLDING"
                    last_gesture_time = current_time

                    print("GRAB", flush=True)

                    ws.send(json.dumps({
                        "type": "gesture",
                        "roomId": ROOM_ID,
                        "value": "GRAB"
                    }))

# -------- DROP --------
                elif (
                    predicted == "DROP"
                    and gesture_state == "HOLDING"
                    and conf > DROP_CONF
                    and openness > DROP_OPEN_MIN
                ):
                    gesture_state = "IDLE"
                    last_gesture_time = current_time

                    print("DROP", flush=True)

                    ws.send(json.dumps({
                        "type": "gesture",
                        "roomId": ROOM_ID,
                        "value": "DROP"
                    }))

    cv2.imshow("Grab-Drop Live", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
