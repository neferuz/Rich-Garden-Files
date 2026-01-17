from app.database import engine, Base
from app.banners import models
# Import other models just in case to ensure they are registered if needed, though usually strict import of target model is enough if Base is shared.
from app.banners import models as banner_models

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")
