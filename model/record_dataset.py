import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import RunningMode
from mediapipe import Image, ImageFormat
import numpy as np
from collections import deque
import os

print("record_dataset.py started")

data = {"grab": [], "drop": []}
SAMPLES = 80
WINDOW_SIZE = 30

os.makedirs("data", exist_ok=True)

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=RunningMode.VIDEO,
    num_hands=1
)

landmarker = HandLandmarker.create_from_options(options)

buffer = deque(maxlen=WINDOW_SIZE)

def normalize_landmarks(landmarks):
    landmarks = np.array(landmarks).reshape(21, 3)
    wrist = landmarks[0]
    landmarks -= wrist
    scale = np.linalg.norm(landmarks[9])
    if scale > 0:
        landmarks /= scale
    return landmarks.flatten()

cap = cv2.VideoCapture(0)

print("Press SPACE to record a sample")

while len(data) < SAMPLES:
    ret, frame = cap.read()
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = Image(
        image_format=ImageFormat.SRGB,
        data=rgb
    )

    timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
    result = landmarker.detect_for_video(mp_image, timestamp_ms)

    if result.hand_landmarks:
        hand = result.hand_landmarks[0]
        raw = []
        for lm in hand:
            raw.extend([lm.x, lm.y, lm.z])
        buffer.append(normalize_landmarks(raw))

    key = cv2.waitKey(1) & 0xFF

    if key == ord('g') and len(buffer) == WINDOW_SIZE:
        data["grab"].append(np.array(buffer))
        print(f"Grab samples: {len(data['grab'])}")

    if key == ord('d') and len(buffer) == WINDOW_SIZE:
        data["drop"].append(np.array(buffer))
        print(f"Drop samples: {len(data['drop'])}")

    print(f"Grab: {len(data['grab'])} | Drop: {len(data['drop'])}")

    if len(buffer) == WINDOW_SIZE:
        print("Sequence shape:", np.array(buffer).shape)

    cv2.imshow("Recording", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

np.save("data/grab.npy", np.array(data["grab"]))
np.save("data/drop.npy", np.array(data["drop"]))
print("Saved:", f"data/{'grab.npy'} ({len(data['grab'])} samples), data/{'drop.npy'} ({len(data['drop'])} samples)")
