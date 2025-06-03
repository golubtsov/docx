import path from 'node:path';
import { Doc, snapshot } from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { WebsocketProvider } from 'y-websocket';
import { AppEnvironment } from '@/common/app/app.environment';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { PrismaService } from '@/common/app/prisma.service';
import { AppStateEnum } from '@/common/app/app.state.enum';

@Injectable()
export class YDocInitializerService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly prismaService: PrismaService,
        private readonly appEnvironment: AppEnvironment,
    ) {}

    async createYDocWithProvider(
        roomId: string,
        fileId: number,
    ): Promise<{ ydoc: Doc; provider: WebsocketProvider }> {
        const ydoc = new Doc();
        await this.initializeYDocContent(ydoc, fileId);

        const provider = new WebsocketProvider(
            this.roomRepository.getYHost(),
            roomId,
            ydoc,
            { WebSocketPolyfill: WebSocket },
        );

        await this.waitForProviderConnection(provider);
        return { ydoc, provider };
    }

    private async initializeYDocContent(
        ydoc: Doc,
        fileId: number,
    ): Promise<void> {
        if (this.appEnvironment.getNodeEnv() === AppStateEnum.Development) {
            ydoc.getMap('root').set('key', 'some value');
        } else {
            await this.loadWithDocxService(ydoc, fileId);
        }
    }

    //TODO Должна быть загрузка из snapshot, но пока это не работает
    private async loadFromSnapshot(fileId: number) {
        const version = await this.prismaService.version.findFirst({
            where: {
                file_id: fileId,
            },
        });

        const doc = new Doc({ gc: false });
        doc.getMap('root').set('key', 'some value');
        const s = snapshot(doc);

        throw new Error('Stop');
    }

    private async loadWithDocxService(ydoc: Doc, fileId: number) {
        const documentService = new DocumentService();

        await documentService.openSystemUri(
            path.join(process.cwd(), `./data/${fileId}.docx`),
        );

        const adapter = new YsyncAdapterService();

        adapter.init(ydoc, documentService.getDocument());
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
