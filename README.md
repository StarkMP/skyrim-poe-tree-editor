# STB Prisma UI

Пользовательский интерфейс для Skyrim True Believer на Prisma UI.

## Требования

- **Node.js**: версия 24 или выше

## Установка

```bash
npm install
```

## Настройка окружения

Создайте файл `.env` в корне проекта на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите путь для сборки проекта:

```env
BUILD_FOLDER=путь/к/вашей/папке/сборки
```

Например:
```env
BUILD_FOLDER=E:/SkyrimSE/MO2/mods/STB_UI/PrismaUI/views/STB_UI
```

## Запуск проекта

Для запуска проекта в режиме разработки:

```bash
npm run dev
```

Проект автоматически откроется в браузере.

## Сборка проекта

Для создания production-сборки:

```bash
npm run build
```

Собранные файлы будут размещены в папке, указанной в переменной `BUILD_FOLDER` в файле `.env`.

## Структура проекта

- `src/` - исходный код приложения
- `src/components/` - React компоненты
- `src/stores/` - хранилища состояния
- `src/utils/` - вспомогательные функции
