from fastapi import APIRouter, UploadFile, File
import shutil
import uuid
import os

router = APIRouter(
    tags=["common"]
)

@router.post("/api/upload") # Keeping path absolute as in original to avoid breaking frontend
async def upload_file(file: UploadFile = File(...)):
    # Ensure directory exists? main.py handles it on startup usually.
    # But good to check
    if not os.path.exists("app/static/uploads"):
        os.makedirs("app/static/uploads", exist_ok=True)
        
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"app/static/uploads/{filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/uploads/{filename}"}
