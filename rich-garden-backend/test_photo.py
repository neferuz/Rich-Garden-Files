import asyncio
import os
import sys

# Add current directory to path to import app
sys.path.append(os.getcwd())

from app.services import telegram

async def test():
    user_id = 670031187
    print(f"Testing photo fetch for {user_id}...")
    url = await telegram.get_chat_photo(user_id)
    print(f"Result URL: {url}")
    if url and os.path.exists(url.lstrip('/')):
        print("File downloaded successfully!")
    else:
        print("Failed to download or find file.")

if __name__ == "__main__":
    asyncio.run(test())
