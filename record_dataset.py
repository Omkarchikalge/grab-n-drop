import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import os

data = {"grab": [], "drop": []}
SAMPLES = 80
WINDOW_SIZE = 30

os.makedirs("data", exist_ok=True)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)

buffer = deque(maxlen=WINDOW_SIZE)
data = []

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
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        hand = result.multi_hand_landmarks[0]
        raw = []
        for lm in hand.landmark:
            raw.extend([lm.x, lm.y, lm.z])
        buffer.append(normalize_landmarks(raw))

        key = cv2.waitKey(1) & 0xFF

    if key == ord('g') and len(buffer) == WINDOW_SIZE:
        data["grab"].append(np.array(buffer))
        print(f"Grab samples: {len(data['grab'])}")

    if key == ord('d') and len(buffer) == WINDOW_SIZE:
        data["drop"].append(np.array(buffer))
        print(f"Drop samples: {len(data['drop'])}")

    print(f"Captured {len(data)}/{SAMPLES}")

    cv2.imshow("Recording", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

np.save("data/grab.npy", np.array(data["grab"]))
np.save("data/drop.npy", np.array(data["drop"]))
print("Saved:", f"data/{'grab.npy'} ({len(data['grab'])} samples), data/{'drop.npy'} ({len(data['drop'])} samples)")
