import streamlit as st
from deepface import DeepFace
import cv2
import numpy as np
import os

st.title("Missing People Detector (DeepFace Version)")

KNOWN_DIR = "known_people"
known_faces = {}

for file in os.listdir(KNOWN_DIR):
    if file.lower().endswith((".jpg", ".png", ".jpeg")):
        path = os.path.join(KNOWN_DIR, file)
        known_faces[file.split(".")[0]] = path

uploaded = st.file_uploader("Upload a photo", type=["jpg", "jpeg", "png"])

if uploaded:
    img_bytes = np.frombuffer(uploaded.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
    st.image(img, channels="BGR", caption="Uploaded Image")

    found = False
    for name, path in known_faces.items():
        try:
            result = DeepFace.verify(img, path, enforce_detection=False)
            if result["verified"]:
                st.success(f"🚨 MATCH FOUND: {name}")
                found = True
                break
        except:
            pass

    if not found:
        st.error("No missing person found.")
