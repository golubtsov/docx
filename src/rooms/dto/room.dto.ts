import * as Y from "yjs";
import {WebsocketProvider} from "y-websocket";

export interface RoomDTO {
    id: string;
    owner_id: string;
    doc: Y.Doc;
    provider: WebsocketProvider;
    clients: Set<string>; // client IDs
    createdAt: Date;
}
