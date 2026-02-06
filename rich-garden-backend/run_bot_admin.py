import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN_ADMIN')
API_URL = 'http://127.0.0.1:8000/api'
MINI_APP_URL = 'https://admin.24eywa.ru'


async def send_msg(chat_id, text, markup=None):
    url = f'https://api.telegram.org/bot{TOKEN}/sendMessage'
    async with httpx.AsyncClient() as client:
        await client.post(
            url,
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML', 'reply_markup': markup},
        )


async def main():
    print('Admin Bot Starting...')
    offset = 0
    async with httpx.AsyncClient() as client:
        await client.post(
            f'https://api.telegram.org/bot{TOKEN}/deleteWebhook',
            json={'drop_pending_updates': True},
        )
        while True:
            try:
                r = await client.get(
                    f'https://api.telegram.org/bot{TOKEN}/getUpdates?offset={offset}&timeout=20',
                    timeout=25,
                )
                res = r.json()
                if res.get('ok'):
                    for u in res.get('result', []):
                        offset = u['update_id'] + 1
                        msg = u.get('message')
                        if msg and msg.get('text') == '/start':
                            await send_msg(
                                msg['chat']['id'],
                                '<b>Админка Rich Garden</b>\n\nНажмите кнопку ниже:',
                                {
                                    'inline_keyboard': [
                                        [
                                            {
                                                'text': '🚀 Панель управления',
                                                'web_app': {'url': MINI_APP_URL},
                                            }
                                        ]
                                    ]
                                },
                            )
                else:
                    await asyncio.sleep(5)
            except Exception as e:
                print(f'Error: {e}')
                await asyncio.sleep(5)


if __name__ == '__main__':
    asyncio.run(main())
