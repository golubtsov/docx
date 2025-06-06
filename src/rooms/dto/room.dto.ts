import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface RoomDTO {
    id: string;
    owner_id: string;
    provider: WebsocketProvider;
    ydoc: Y.Doc;
    clients: Set<string>; // client IDs
    file_id: string;
}
