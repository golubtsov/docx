import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { AppEnvironment } from '@/common/app/app.environment';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';

@Injectable()
export class YDocInitializerService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly appEnv: AppEnvironment,
    ) {}

    async createYDocWithProvider(
        roomId: string,
    ): Promise<{ ydoc: Doc; provider: WebsocketProvider }> {
        const ydoc = new Doc();
        await this.initializeYDocContent(ydoc);

        const provider = new WebsocketProvider(
            this.roomRepository.getYHost(),
            roomId,
            ydoc,
            { WebSocketPolyfill: WebSocket },
        );

        await this.waitForProviderConnection(provider);
        return { ydoc, provider };
    }

    private async initializeYDocContent(ydoc: Doc): Promise<void> {
        // временно убрал чтение документа
        // const documentService = new DocumentService();
        //
        // await documentService.openSystemUri(
        //     path.join(process.cwd(), './data/paragraphs.docx'),
        // );
        //const adapter = new YsyncAdapterService();
        //adapter.init(ydoc, documentService.getDocument());

        ydoc.getMap('root').set('key', 'some value');
    }

    private async waitForProviderConnection(
        provider: WebsocketProvider,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            provider.on('status', ({ status }) => {
                if (status === 'connected') resolve();
            });
            provider.on('connection-error', reject);
        });
    }
}
