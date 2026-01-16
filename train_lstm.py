import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

grab = np.load("data/grab.npy")
drop = np.load("data/drop.npy")

X = np.concatenate([grab, drop])
y = np.array([0]*len(grab) + [1]*len(drop))

model = Sequential([
    LSTM(64, input_shape=(30, 63)),
    Dense(32, activation="relu"),
    Dense(2, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.fit(X, y, epochs=20, batch_size=8, shuffle=True)

model.save("gesture_model.h5")
print("Model saved as gesture_model.h5")