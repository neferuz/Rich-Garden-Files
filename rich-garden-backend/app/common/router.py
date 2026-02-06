from fastapi import APIRouter, UploadFile, File
import shutil
import uuid
import os
from PIL import Image
import io

router = APIRouter(
    tags=["common"]
)

def optimize_image(image_data: bytes, max_size: tuple = (1920, 1920), quality: int = 85) -> bytes:
    """Optimize image: resize if too large and compress"""
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Resize if too large
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save as optimized JPEG
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"Image optimization error: {e}")
        return image_data  # Return original if optimization fails

@router.post("/api/upload") # Keeping path absolute as in original to avoid breaking frontend
async def upload_file(file: UploadFile = File(...)):
    # Ensure directory exists
    if not os.path.exists("app/static/uploads"):
        os.makedirs("app/static/uploads", exist_ok=True)
    
    # Read file content
    file_content = await file.read()
    
    # Check if it's an image
    is_image = file.content_type and file.content_type.startswith('image/')
    
    # Generate unique filename
    if is_image:
        # Optimize image
        try:
            optimized_content = optimize_image(file_content)
            file_extension = "jpg"  # Always save as JPEG after optimization
        except:
            optimized_content = file_content
            file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    else:
        optimized_content = file_content
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"app/static/uploads/{filename}"
    
    # Save optimized file
    with open(file_location, "wb") as buffer:
        buffer.write(optimized_content)
        
    return {"url": f"/static/uploads/{filename}"}
