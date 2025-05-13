```
git clone  https://gitlab.els24.com/epicdoc/docxservice.git packages/docxservice

git clone  https://gitlab.els24.com/epicdoc/editorlibrary.git packages/editorlibrary

npm i
```

Команда для запуска сервера, который отвечает за синхронизацию YJS
```
npm run y-websocket
```

Эти команды должны работать одновременно

- ``npm run start:dev``
- ``npm run y-websocket``