import {WebsocketProvider} from "y-websocket";

export interface RoomDTO {
    id: string;
    owner_id: string;
    provider: WebsocketProvider;
    clients: Set<string>; // client IDs
}
