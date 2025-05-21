import Polyglot from 'node-polyglot';

export const polyglot = new Polyglot({
    phrases: {
        ws_connect: 'Соединение установлено',
        room: {
            error: {
                create: 'Ошибка создания комнаты',
                join: 'Ошибка при подключении к комнате',
                multiple:
                    'Вы подключены к одной комнате, чтобы создать новую, выйдите из первой',
                not_found: 'Комната не найдена',
            },
            connected_already: 'Вы уже подключены к комнате',
            connected: 'Вы подключились к комнате',
            left: 'Вы покинули комнату',
            user_not_have_rooms: 'У пользователя нет комнат',
            cant_delete_room: 'Вы не можете удалить комнату',
            deleted: 'Комната удалена',
        },
    },
    locale: 'ru',
});
