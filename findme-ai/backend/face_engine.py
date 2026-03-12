"""
face_engine.py — AI Face Comparison Core
=========================================
Uses DeepFace (which wraps VGG-Face, FaceNet, ArcFace, etc.) to:
  1. Extract face embeddings from images
  2. Compare two face embeddings and return a similarity score (0–100%)

If DeepFace is not installed, a lightweight OpenCV fallback is used so
the rest of the app still functions for demo purposes.
"""

import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

# ── Try to import DeepFace (GPU / CPU) ───────────────────────────────────────
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logger.info("✅  DeepFace loaded — using ArcFace model")
except ImportError:
    DEEPFACE_AVAILABLE = False
    logger.warning("⚠️   DeepFace not found — using histogram fallback")


# ── Public API ────────────────────────────────────────────────────────────────

def compare_faces(image_path_1: str, image_path_2: str) -> dict:
    """
    Compare two face images and return a similarity score.

    Parameters
    ----------
    image_path_1 : str  — absolute path to image A (e.g. the missing-person photo)
    image_path_2 : str  — absolute path to image B (e.g. the sighting photo)

    Returns
    -------
    {
        'similarity'  : float   — 0–100, higher = more similar
        'is_match'    : bool    — True if similarity >= MATCH_THRESHOLD
        'model'       : str     — which backend was used
        'error'       : str|None
    }
    """
    MATCH_THRESHOLD = 85.0  # percentage — configurable

    if not os.path.exists(image_path_1):
        return _error_result(f"Image not found: {image_path_1}")
    if not os.path.exists(image_path_2):
        return _error_result(f"Image not found: {image_path_2}")

    if DEEPFACE_AVAILABLE:
        return _deepface_compare(image_path_1, image_path_2, MATCH_THRESHOLD)
    else:
        return _histogram_compare(image_path_1, image_path_2, MATCH_THRESHOLD)


# ── DeepFace backend ──────────────────────────────────────────────────────────

def _deepface_compare(path1: str, path2: str, threshold: float) -> dict:
    """
    Use DeepFace with the ArcFace model for high-accuracy comparison.
    ArcFace is state-of-the-art for face recognition and works well on
    photos taken in varied lighting / angles.
    """
    try:
        # verify=True runs the full recognition pipeline including
        # face detection, alignment, embedding, and distance calculation
        result = DeepFace.verify(
            img1_path = path1,
            img2_path = path2,
            model_name = 'ArcFace',       # alternatives: VGG-Face, Facenet512, SFace
            detector_backend = 'retinaface',  # robust face detector
            enforce_detection = False,     # don't crash if no face detected
            align = True,
        )

        # DeepFace returns a distance (lower = more similar).
        # Convert to a 0–100 similarity score.
        distance   = result.get('distance', 1.0)
        similarity = max(0.0, (1.0 - distance) * 100)

        return {
            'similarity': round(similarity, 2),
            'is_match':   similarity >= threshold,
            'model':      'DeepFace/ArcFace',
            'error':      None,
        }

    except Exception as exc:
        logger.error("DeepFace error: %s", exc)
        # Fall back to histogram on any DeepFace error
        return _histogram_compare(path1, path2, threshold)


# ── Histogram fallback (no GPU / no DeepFace install) ────────────────────────

def _histogram_compare(path1: str, path2: str, threshold: float) -> dict:
    """
    Lightweight colour-histogram comparison using OpenCV.
    NOT a real face recognition algorithm — only suitable for demos
    where DeepFace cannot be installed.
    """
    try:
        import cv2

        img1 = cv2.imread(path1)
        img2 = cv2.imread(path2)

        if img1 is None or img2 is None:
            return _error_result("Could not decode one or both images")

        # Resize to a common size to make comparison fair
        size = (200, 200)
        img1 = cv2.resize(img1, size)
        img2 = cv2.resize(img2, size)

        # Compare histograms in HSV colour space (more perceptually uniform)
        hsv1 = cv2.cvtColor(img1, cv2.COLOR_BGR2HSV)
        hsv2 = cv2.cvtColor(img2, cv2.COLOR_BGR2HSV)

        hist1 = cv2.calcHist([hsv1], [0, 1], None, [50, 60], [0, 180, 0, 256])
        hist2 = cv2.calcHist([hsv2], [0, 1], None, [50, 60], [0, 180, 0, 256])

        cv2.normalize(hist1, hist1)
        cv2.normalize(hist2, hist2)

        # Correlation method: 1.0 = identical, -1.0 = opposite
        score      = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        similarity = max(0.0, score * 100)  # convert to 0–100

        return {
            'similarity': round(similarity, 2),
            'is_match':   similarity >= threshold,
            'model':      'OpenCV/Histogram (fallback)',
            'error':      None,
        }

    except Exception as exc:
        return _error_result(str(exc))


def _error_result(message: str) -> dict:
    return {'similarity': 0.0, 'is_match': False, 'model': 'none', 'error': message}
