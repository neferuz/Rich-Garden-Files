from app.database import SessionLocal
from app.calendar import models
from app.users import models as user_models

db = SessionLocal()
members = db.query(models.FamilyMember).all()
events = db.query(models.CalendarEvent).all()

print(f"Family Members Count: {len(members)}")
for m in members:
    print(f" - {m.id}: {m.name} (User: {m.user_id}, Bday: {m.birthday})")

print(f"Events Count: {len(events)}")
for e in events:
    print(f" - {e.id}: {e.title} (Date: {e.date})")
