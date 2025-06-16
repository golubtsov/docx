## Запуск проекта    

В docxservice пакете ветка должна быть develop включена

```
git clone  https://gitlab.els24.com/epicdoc/docxservice.git packages/docxservice

docker compose up -d
```

В контейнере

```
npm i --legacy-peer-deps

npx prisma db push

npx prisma generate
```

## Общее

Команда для запуска сервера, который отвечает за синхронизацию YJS
```
npm run y-websocket
```

Эти команды должны работать одновременно

- ``npm run start:dev``
- ``npm run y-websocket``

| ⚠️⚠️⚠️<br/>Настрой форматирование в своей IDE<br/><br/>Подключен prettier<br/>⚠️⚠️⚠️ |
|---------------------------------------------------------------------------------|

Форматирование

```
npm run prettier
```

Форматирование без изменений

```
npm run prettier:check
```
