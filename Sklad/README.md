# Sklad - Next.js проект

Этот проект создан с использованием [Next.js](https://nextjs.org/).

## Структура проекта

```
sklad/
├── app/                    # App Router директория
│   ├── api/               # API routes
│   ├── components/        # React компоненты
│   ├── layout.tsx        # Корневой layout
│   ├── page.tsx          # Главная страница
│   └── globals.css       # Глобальные стили
├── lib/                   # Утилиты и вспомогательные функции
├── public/                # Статические файлы
├── next.config.js         # Конфигурация Next.js
├── tsconfig.json          # Конфигурация TypeScript
└── package.json           # Зависимости проекта
```

## Начало работы

Сначала установите зависимости:

```bash
npm install
# или
yarn install
# или
pnpm install
```

Затем запустите сервер разработки:

```bash
npm run dev
# или
yarn dev
# или
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере, чтобы увидеть результат.

## Команды

- `npm run dev` - Запуск сервера разработки
- `npm run build` - Сборка проекта для продакшена
- `npm run start` - Запуск продакшен сервера
- `npm run lint` - Запуск линтера

## Узнать больше

Чтобы узнать больше о Next.js, посетите следующие ресурсы:

- [Next.js Documentation](https://nextjs.org/docs) - изучите функции и API Next.js
- [Learn Next.js](https://nextjs.org/learn) - интерактивный учебник Next.js

