
from app.database import SessionLocal
from app.users.models import TelegramUser
from app.calendar.models import FamilyMember, CalendarEvent

db = SessionLocal()
users = db.query(TelegramUser).all()
print("USERS:")
for u in users:
    print(f"ID: {u.id}, Name: {u.first_name}, Photo: {u.photo_url}")

family = db.query(FamilyMember).all()
print("\nFAMILY:")
for f in family:
    print(f"ID: {f.id}, Name: {f.name}, UserID: {f.user_id}")

events = db.query(CalendarEvent).all()
print("\nEVENTS:")
for e in events:
    print(f"ID: {e.id}, Title: {e.title}, UserID: {e.user_id}")

db.close()
