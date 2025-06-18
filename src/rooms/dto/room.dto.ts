import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface RoomDTO {
    id: string;
    ownerId: string;
    provider: WebsocketProvider;
    ydoc: Y.Doc;
    clients: Set<string>; // client IDs
    fileId: string;
    resourceId: string;
}
