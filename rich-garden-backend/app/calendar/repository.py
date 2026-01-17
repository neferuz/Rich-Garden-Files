from sqlalchemy.orm import Session
from app.calendar import models, schemas
from typing import List, Optional

class CalendarRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_family_members(self, user_id: int) -> List[models.FamilyMember]:
        from sqlalchemy.orm import joinedload
        return self.db.query(models.FamilyMember).options(joinedload(models.FamilyMember.user)).filter(models.FamilyMember.user_id == user_id).all()

    def create_family_member(self, user_id: int, member: schemas.FamilyMemberCreate) -> models.FamilyMember:
        db_member = models.FamilyMember(**member.dict(), user_id=user_id)
        self.db.add(db_member)
        self.db.commit()
        self.db.refresh(db_member)
        return db_member

    def delete_family_member(self, user_id: int, member_id: int) -> bool:
        member = self.db.query(models.FamilyMember).filter(
            models.FamilyMember.id == member_id,
            models.FamilyMember.user_id == user_id
        ).first()
        if member:
            self.db.delete(member)
            self.db.commit()
            return True
        return False

    def get_events(self, user_id: int) -> List[models.CalendarEvent]:
        from sqlalchemy.orm import joinedload
        return self.db.query(models.CalendarEvent).options(joinedload(models.CalendarEvent.user)).filter(models.CalendarEvent.user_id == user_id).all()

    def create_event(self, user_id: int, event: schemas.CalendarEventCreate) -> models.CalendarEvent:
        db_event = models.CalendarEvent(**event.dict(), user_id=user_id)
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def delete_event(self, user_id: int, event_id: int) -> bool:
        event = self.db.query(models.CalendarEvent).filter(
            models.CalendarEvent.id == event_id,
            models.CalendarEvent.user_id == user_id
        ).first()
        if event:
            self.db.delete(event)
            self.db.commit()
            return True
        return False
