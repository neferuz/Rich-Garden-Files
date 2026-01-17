from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.stories import schemas, repository

router = APIRouter(prefix="/api/stories", tags=["stories"])

@router.get("/", response_model=List[schemas.Story])
def read_stories(user_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    stories = repository.get_all(db, skip=skip, limit=limit, user_id=user_id)
    return stories

@router.get("/{story_id}/stats/", response_model=schemas.StoryStats)
@router.get("/{story_id}/stats", response_model=schemas.StoryStats)
def read_story_stats(story_id: int, db: Session = Depends(get_db)):
    stats = repository.get_stats(db, story_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return stats

@router.post("/{story_id}/view/{user_id}/") # Path with slash
@router.post("/{story_id}/view/{user_id}")  # Path without slash
def log_story_view(story_id: int, user_id: int, db: Session = Depends(get_db)):
    repository.log_view(db, story_id, user_id)
    return {"message": "View logged"}

@router.get("/{story_id}", response_model=schemas.Story)
def read_story(story_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    db_story = repository.get_by_id(db, story_id, user_id=user_id)
    if db_story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return db_story

@router.post("/", response_model=schemas.Story)
def create_story(story: schemas.StoryCreate, db: Session = Depends(get_db)):
    return repository.create(db, story)

@router.patch("/{story_id}", response_model=schemas.Story)
def update_story(story_id: int, story: schemas.StoryUpdate, db: Session = Depends(get_db)):
    db_story = repository.update(db, story_id, story)
    if db_story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return db_story

@router.delete("/{story_id}")
def delete_story(story_id: int, db: Session = Depends(get_db)):
    success = repository.delete(db, story_id)
    if not success:
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": "Story deleted"}
