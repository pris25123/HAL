from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from process_video import convert_to_grayscale, convert_to_thermal, extract_frames
from ultralytics import YOLO
import glob
import shutil
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
DETECT_DIR = "runs/detect"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(DETECT_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")
app.mount("/runs", StaticFiles(directory="runs"), name="runs")

@app.post("/upload_video/")
async def upload_video(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    return {"filename": file.filename}

@app.post("/process_video/")
async def process_video(filename: str = Form(...)):
    input_path = os.path.join(UPLOAD_DIR, filename)
    gray_path = os.path.join(PROCESSED_DIR, f"gray_{filename}")
    thermal_path = os.path.join(PROCESSED_DIR, f"thermal_{filename}")
    gray_frames_dir = os.path.join(PROCESSED_DIR, f"gray_frames_{filename}")
    thermal_frames_dir = os.path.join(PROCESSED_DIR, f"thermal_frames_{filename}")

    # Convert to grayscale and thermal
    convert_to_grayscale(input_path, gray_path)
    convert_to_thermal(input_path, thermal_path)

    # Extract frames
    extract_frames(gray_path, gray_frames_dir)
    extract_frames(thermal_path, thermal_frames_dir)

    # List frame files
    gray_frames = sorted([os.path.join(gray_frames_dir, f) for f in os.listdir(gray_frames_dir)])
    thermal_frames = sorted([os.path.join(thermal_frames_dir, f) for f in os.listdir(thermal_frames_dir)])

    # Ensure all paths use forward slashes
    return {
        "gray_video": gray_path.replace("\\", "/"),
        "thermal_video": thermal_path.replace("\\", "/"),
        "gray_frames": [f.replace("\\", "/") for f in gray_frames],
        "thermal_frames": [f.replace("\\", "/") for f in thermal_frames]
    }

@app.post("/detect/")
async def detect(filename: str = Form(...)):
    input_path = os.path.join(UPLOAD_DIR, filename)
    model_path = "best.pt"  # Place your best.pt in backend/ or provide full path
    output_dir = DETECT_DIR

    model = YOLO(model_path)
    results = model(input_path, save=True, project=output_dir, name='', exist_ok=True)

    # Search for .mp4 or .avi in output_dir and its subfolders
    import glob
    video_files = glob.glob(os.path.join(output_dir, "**", "*.mp4"), recursive=True)
    video_files += glob.glob(os.path.join(output_dir, "**", "*.avi"), recursive=True)

    if video_files:
        return {"result_video": video_files[0].replace("\\", "/")}
    else:
        return {"error": "Detection output not found."}

@app.post("/clear_folders/")
async def clear_folders():
    folders_to_clear = [UPLOAD_DIR, PROCESSED_DIR, DETECT_DIR]
    for folder in folders_to_clear:
        if os.path.isdir(folder):
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
    return {"message": "Temporary folders cleared."}

@app.get("/download/")
async def download_file(path: str):
    import os
    allowed_dirs = [os.path.abspath(UPLOAD_DIR), os.path.abspath(PROCESSED_DIR), os.path.abspath("runs")]
    abs_path = os.path.abspath(path)
    if not any(abs_path.startswith(d) for d in allowed_dirs):
        return {"error": "Invalid file path."}
    filename = os.path.basename(path)
    return FileResponse(abs_path, media_type="application/octet-stream", filename=filename) 