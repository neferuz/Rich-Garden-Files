
# Deployment Instructions

## 1. Prerequisites
- Docker & Docker Compose
- Nginx (optional, for reverse proxy)
- Domain name with SSL (Certbot)

## 2. Setup

### Backend (FastAPI)
1. Navigate to `rich-garden-backend`.
2. Create `.env` (or copy from local):
   ```env
   DATABASE_URL=postgresql://user:pass@db:5432/richgarden
   TELEGRAM_BOT_TOKEN=8292591771:AAF4JuZ5CnUaLLGIYM9cSPGnBHrjBpRQqTU
   TELEGRAM_GROUP_ID=670031187
   ```
3. Docker Compose will handle the DB and Backend.

### Frontend Apps (Next.js)
We have two frontend applications:
1. `rich-garden-app` (Customer Mini App) - Port 3000
2. `Sklad` (Admin Panel) - Port 3001

## 3. Docker Compose (Recommended)
Save this as `docker-compose.yml` in the root folder containing all projects:

```yaml
version: '3.8'

services:
  # Database
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: richgarden
    ports:
      - "5432:5432"

  # Backend API + Bot
  backend:
    build: ./rich-garden-backend
    command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    volumes:
      - ./rich-garden-backend:/app
    environment:
      - DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/richgarden
      - TELEGRAM_BOT_TOKEN=8292591771:AAF4JuZ5CnUaLLGIYM9cSPGnBHrjBpRQqTU
      - TELEGRAM_GROUP_ID=670031187
    depends_on:
      - db
    ports:
      - "8000:8000"

  # Bot Poller (Separate Service)
  bot:
    build: ./rich-garden-backend
    command: python run_bot.py
    environment:
      - DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/richgarden
      - TELEGRAM_BOT_TOKEN=8292591771:AAF4JuZ5CnUaLLGIYM9cSPGnBHrjBpRQqTU
    depends_on:
      - backend

  # Customer App
  webapp:
    build: ./rich-garden-app
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-domain.com/api

  # Admin Panel
  admin:
    build: ./Sklad
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-domain.com/api

volumes:
  postgres_data:
```

## 4. Running
```bash
docker-compose up -d --build
```

## 5. Manual Setup (PM2)
If you prefer running on bare metal:

```bash
# Install PM2
npm install -g pm2

# Start Backend
cd rich-garden-backend
source venv/bin/activate
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name backend
pm2 start "python run_bot.py" --name bot

# Start Customer App
cd ../rich-garden-app
npm run build
pm2 start "npm start -- -p 3000" --name webapp

# Start Admin Panel
cd ../Sklad
npm run build
pm2 start "npm start -- -p 3001" --name admin

# Save
pm2 save
pm2 startup
```
