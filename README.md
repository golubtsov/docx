## Запуск проекта    
```
git clone  https://gitlab.els24.com/epicdoc/docxservice.git packages/docxservice

docker compose up -d
```

В контейнере

```
npm i
```

## Общее

Команда для запуска сервера, который отвечает за синхронизацию YJS
```
npm run y-websocket
```

Эти команды должны работать одновременно

- ``npm run start:dev``
- ``npm run y-websocket``
