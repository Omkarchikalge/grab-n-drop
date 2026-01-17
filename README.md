## Overview
This module provides real-time hand gesture recognition for the Grab-N-Drop platform.
It detects user intent through natural hand movements and emits discrete gesture events
that can be consumed by backend systems (WebSocket / WebRTC / P2P).

# 🔍 What this module does
1. Uses MediaPipe Hand Landmarks for real-time hand tracking
2. Uses a temporal LSTM model to understand hand motion
3. Runs fully on-device (no video upload)
4. Prints gesture events to console output

# Gesture events:
GRAB
DROP

These events are intended to be consumed by:
WebSocket server
WebRTC data channel
Any event-based backend logic

# 🧠 Gesture Definitions (Important)
Gesture	Meaning	Hand Action
GRAB	Start / pick / hold	Close hand (fist)
DROP	Release / send	Open hand (palm)

# Gesture flow:
IDLE → GRAB → HOLDING → DROP → IDLE
A DROP will never occur without a prior GRAB.


# 📁 Project Structure
grab-n-drop/
│
├── live_inference.py        # 🔴 MAIN FILE (run this)
├── record_dataset.py        # Dataset recording (used during training)
├── train_lstm.py            # Model training script
├── gesture_model.h5         # Trained LSTM model
├── hand_landmarker.task     # MediaPipe hand model
├── requirements.txt
└── README.md


# ⚙️ Setup Instructions

1️⃣ Create virtual environment
python -m venv venv
venv\Scripts\activate

2️⃣ Install dependencies
pip install -r requirements.txt

▶️ How to run (MOST IMPORTANT)
Start gesture detection:
python live_inference.py


# Expected console output:

Live inference started — press ESC to exit
GRAB
DROP

# 🖨️ Console Output Contract (VERY IMPORTANT)

The AI only prints:
GRAB
DROP
One event per line
Printed only when a gesture is detected
No continuous spam
No JSON
No extra logs (ignore TensorFlow warnings)

👉 This output is the integration interface.

## Expected message mapping:(after integration)
{
  "type": "GESTURE",
  "action": "GRAB"
}


or

{
  "type": "GESTURE",
  "action": "DROP"
}

# Important rules:

1. Treat gestures like button presses

2. Do NOT expect continuous data

3. Do NOT request landmarks or video

4. Backend controls what GRAB/DROP means

## 🧪 How to test gestures manually

Run python live_inference.py

Show hand to camera

Close hand → GRAB

Hold fist → no output

Open hand → DROP

Repeat

If this works → integration is safe.

## 🚫 What this module does NOT do

❌ No networking

❌ No WebSocket code

❌ No file transfer logic

❌ No UI rendering logic

This separation is intentional and correct.

## 🧠 Design Philosophy

“AI detects intent, backend decides action.”

This makes the system:

Modular

Scalable

Replaceable

Easy to debug

## 🧑‍🤝‍🧑 Handoff Summary (Important)

Run live_inference.py

Read stdout

On GRAB → start action

On DROP → complete action

Ignore everything else

That’s it.

## ✅ Status

Model: Stable

Latency: Real-time

Accuracy: Good for MVP / hackathon

Integration: Ready
