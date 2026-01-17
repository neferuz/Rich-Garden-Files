from sqlalchemy.orm import Session
from typing import Optional
from app.stories import models, schemas

def get_all(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None):
    stories = db.query(models.Story).filter(models.Story.is_active == True).order_by(models.Story.created_at.desc()).offset(skip).limit(limit).all()
    # Add view count and is_viewed_by_me manually
    for story in stories:
        story.views_count = db.query(models.StoryView).filter(models.StoryView.story_id == story.id).count()
        if user_id:
            story.is_viewed_by_me = db.query(models.StoryView).filter(
                models.StoryView.story_id == story.id,
                models.StoryView.user_id == user_id
            ).first() is not None
        else:
            story.is_viewed_by_me = False
    return stories

def get_by_id(db: Session, story_id: int, user_id: Optional[int] = None):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if story:
        story.views_count = db.query(models.StoryView).filter(models.StoryView.story_id == story.id).count()
        if user_id:
            story.is_viewed_by_me = db.query(models.StoryView).filter(
                models.StoryView.story_id == story.id,
                models.StoryView.user_id == user_id
            ).first() is not None
        else:
            story.is_viewed_by_me = False
    return story

def create(db: Session, story: schemas.StoryCreate):
    db_story = models.Story(**story.model_dump())
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def update(db: Session, story_id: int, story_data: schemas.StoryUpdate):
    db_story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not db_story:
        return None
    
    update_data = story_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_story, key, value)
    
    db.commit()
    db.refresh(db_story)
    return db_story

def delete(db: Session, story_id: int):
    db_story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if db_story:
        db.delete(db_story)
        db.commit()
        return True
    return False

def log_view(db: Session, story_id: int, user_id: int):
    # Check if user already viewed this story to avoid double counting
    # Or just log every view? Typically it's better to log unique views or 
    # specific intervals. Let's do unique for now.
    existing = db.query(models.StoryView).filter(
        models.StoryView.story_id == story_id,
        models.StoryView.user_id == user_id
    ).first()
    
    if not existing:
        db_view = models.StoryView(story_id=story_id, user_id=user_id)
        db.add(db_view)
        db.commit()
    return True

def get_stats(db: Session, story_id: int):
    story = get_by_id(db, story_id)
    if not story:
        return None
        
    viewers_raw = db.query(models.StoryView).filter(models.StoryView.story_id == story_id).order_by(models.StoryView.viewed_at.desc()).all()
    
    # Import here to avoid circular dependencies
    from app.users import models as user_models
    
    viewers = []
    for v in viewers_raw:
        # Try to find user name and photo
        user = db.query(user_models.TelegramUser).filter(user_models.TelegramUser.telegram_id == v.user_id).first()
        user_name = user.first_name if user else f"User {v.user_id}"
        user_photo = user.photo_url if user else None
        
        viewers.append({
            "user_id": v.user_id,
            "user_name": user_name,
            "user_photo": user_photo,
            "viewed_at": v.viewed_at
        })
    
    return {
        "id": story.id,
        "title": story.title,
        "views_count": len(viewers),
        "viewers": viewers
    }
