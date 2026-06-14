"""Download MediaPipe model files required by BowlSmart backend.

Run this once before starting the server:
    python backend/download_models.py
"""

import os
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(__file__), "app", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODELS = {
    "pose_landmarker_heavy.task": (
        "https://storage.googleapis.com/mediapipe-models/"
        "pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
    ),
}


def download_file(url: str, dest: str) -> None:
    filename = os.path.basename(dest)
    if os.path.isfile(dest):
        print(f"  [skip] {filename} already exists.")
        return
    print(f"  [download] {filename} ...", end="", flush=True)

    def _progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        pct = min(100, downloaded * 100 // total_size) if total_size > 0 else "?"
        print(f"\r  [download] {filename} ... {pct}%", end="", flush=True)

    urllib.request.urlretrieve(url, dest, reporthook=_progress)
    print(f"\r  [done]     {filename}")


if __name__ == "__main__":
    print("Downloading BowlSmart MediaPipe models...")
    for name, url in MODELS.items():
        dest = os.path.join(MODELS_DIR, name)
        download_file(url, dest)
    print("\nAll models ready.")
