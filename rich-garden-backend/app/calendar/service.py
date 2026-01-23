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
    real_events = repo.get_events(user.id)
    
    # Process virtual birthday events from family members
    all_events = []
    
    # Add real events first
    for e in real_events:
        # Convert to dict if needed or keep as object
        all_events.append(e)

    # Add family birthdays as virtual events
    from datetime import datetime
    current_year = datetime.now().year
    
    for member in family:
        if member.birthday:
            try:
                # Parse YYYY-MM-DD
                bday_date = datetime.strptime(member.birthday, "%Y-%m-%d").date()
                # Create the event date for the current year
                event_date = bday_date.replace(year=current_year)
                
                # Check if we already have a manual event for this member's birthday to avoid dupes
                # (though usually users will use the auto-virtual ones)
                is_duplicate = any(
                    e.type == 'birthday' and e.family_member_id == member.id 
                    for e in real_events
                )
                
                if not is_duplicate:
                    # Create a virtual event object (minimal fields needed for frontend)
                    from .models import CalendarEvent
                    virtual_event = CalendarEvent(
                        id=f"v-{member.id}", # Virtual ID
                        user_id=user.id,
                        family_member_id=member.id,
                        title=f"День рождения: {member.name}",
                        date=event_date,
                        type="birthday",
                        created_at=member.created_at # Ensure created_at is present
                    )
                    all_events.append(virtual_event)
            except Exception as e:
                print(f"Failed to generate virtual bday event for {member.name}: {e}")

    return {
        "family": family,
        "events": all_events
    }

def create_family_member(db: Session, telegram_id: int, member: schemas.FamilyMemberCreate):
    user = get_or_create_user(db, telegram_id)
    repo = calendar_repo.CalendarRepository(db)
    
    db_member = repo.create_family_member(user.id, member)
    # No longer auto-creating a separate record in calendar_events table
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

from typing import Union

def delete_event(db: Session, telegram_id: int, event_id: Union[int, str]):
    user = user_repo.get_by_telegram_id(db, telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle virtual events (starting with v-)
    if isinstance(event_id, str) and event_id.startswith('v-'):
        # For virtual birthdays, we suggest deleting the family member instead
        # or we can automatically do it (but that's destructive, better to return error)
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete a virtual birthday event directly. Delete the contact instead."
        )

    repo = calendar_repo.CalendarRepository(db)
    if not repo.delete_event(user.id, int(event_id)):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "OK"}

def get_all_calendar_data(db: Session):
    from sqlalchemy.orm import joinedload
    from datetime import datetime
    family = db.query(calendar_repo.models.FamilyMember).options(joinedload(calendar_repo.models.FamilyMember.user)).all()
    real_events = db.query(calendar_repo.models.CalendarEvent).options(joinedload(calendar_repo.models.CalendarEvent.user)).all()
    
    all_events = [e for e in real_events]
    current_year = datetime.now().year

    # Add virtual birthdays
    for member in family:
        if member.birthday:
            try:
                bday_date = datetime.strptime(member.birthday, "%Y-%m-%d").date()
                event_date = bday_date.replace(year=current_year)
                
                is_duplicate = any(
                    e.type == 'birthday' and e.family_member_id == member.id 
                    for e in real_events
                )
                
                if not is_duplicate:
                    from .models import CalendarEvent
                    virtual_event = CalendarEvent(
                        id=f"v-{member.id}", 
                        user_id=member.user_id,
                        family_member_id=member.id,
                        title=f"День рождения: {member.name}",
                        date=event_date,
                        type="birthday",
                        user=member.user,
                        created_at=member.created_at
                    )
                    all_events.append(virtual_event)
            except Exception as e:
                print(f"Failed to generate virtual bday event for admin: {e}")

    return {
        "family": family,
        "events": all_events
    }
