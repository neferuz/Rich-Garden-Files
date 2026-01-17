from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository as calendar_repo
from . import schemas
from app.users import repository as user_repo

def get_or_create_user(db: Session, telegram_id: int):
    user = user_repo.get_by_telegram_id(db, telegram_id)
    if not user:
        # Create a basic user if not exists (for calendar support)
        from app.users.schemas import TelegramUserCreate
        user_in = TelegramUserCreate(
            telegram_id=telegram_id,
            first_name=f"User {telegram_id}",
            username=f"user_{telegram_id}"
        )
        user = user_repo.create_or_update_telegram_user(db, user_in)
    return user

def get_calendar_data(db: Session, telegram_id: int):
    user = user_repo.get_by_telegram_id(db, telegram_id)
    repo = calendar_repo.CalendarRepository(db)

    if not user:
        return {"family": [], "events": []}
    
    family = repo.get_family_members(user.id)
    events = repo.get_events(user.id)
    
    return {
        "family": family,
        "events": events
    }

def create_family_member(db: Session, telegram_id: int, member: schemas.FamilyMemberCreate):
    user = get_or_create_user(db, telegram_id)
    repo = calendar_repo.CalendarRepository(db)
    
    db_member = repo.create_family_member(user.id, member)
    
    # Auto-create a birthday event for this member if birthday is provided
    if member.birthday:
        try:
            # Parse YYYY-MM-DD
            from datetime import datetime
            bday_date = datetime.strptime(member.birthday, "%Y-%m-%d").date()
            # Set to current year for the event list
            current_bday = bday_date.replace(year=datetime.now().year)
            
            event_in = schemas.CalendarEventCreate(
                title=f"День рождения: {member.name}",
                date=current_bday,
                type="birthday",
                family_member_id=db_member.id
            )
            repo.create_event(user.id, event_in)
        except Exception as e:
            print(f"Failed to auto-create bday event: {e}")

    return db_member

def delete_family_member(db: Session, telegram_id: int, member_id: int):
    user = user_repo.get_by_telegram_id(db, telegram_id)
    if not user:
        return {"message": "User not found"}
    
    repo = calendar_repo.CalendarRepository(db)
    # Delete associated events
    db.query(calendar_repo.models.CalendarEvent).filter(
        calendar_repo.models.CalendarEvent.user_id == user.id,
        calendar_repo.models.CalendarEvent.family_member_id == member_id
    ).delete()
    db.commit()
    
    if not repo.delete_family_member(user.id, member_id):
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "OK"}

def create_event(db: Session, telegram_id: int, event: schemas.CalendarEventCreate):
    user = get_or_create_user(db, telegram_id)
    repo = calendar_repo.CalendarRepository(db)
    return repo.create_event(user.id, event)

def delete_event(db: Session, telegram_id: int, event_id: int):
    user = user_repo.get_by_telegram_id(db, telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    repo = calendar_repo.CalendarRepository(db)
    if not repo.delete_event(user.id, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "OK"}

def get_all_calendar_data(db: Session):
    from sqlalchemy.orm import joinedload
    family = db.query(calendar_repo.models.FamilyMember).options(joinedload(calendar_repo.models.FamilyMember.user)).all()
    events = db.query(calendar_repo.models.CalendarEvent).options(joinedload(calendar_repo.models.CalendarEvent.user)).all()
    
    return {
        "family": family,
        "events": events
    }
