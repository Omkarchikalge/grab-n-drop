import cv2
import numpy as np
from mediapipe.tasks.python import vision, BaseOptions
import mediapipe as mp


MODEL_PATH = "hand_landmarker.task"

options = vision.HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    num_hands=1,
    running_mode=vision.RunningMode.VIDEO
)

landmarker = vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)
frame_id = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=frame_rgb
        )

    result = landmarker.detect_for_video(mp_image, frame_id)
    frame_id += 1

    if result.hand_landmarks:
        landmarks = result.hand_landmarks[0]
        data = np.array([[lm.x, lm.y, lm.z] for lm in landmarks]).flatten()
        print(data.shape)  # MUST PRINT (63,)

    cv2.imshow("Hand Tracking", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
