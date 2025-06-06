import path from 'node:path';
import { Doc, snapshot } from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { WebsocketProvider } from 'y-websocket';
import { AppEnvironment } from '@/common/app/app.environment';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { PrismaService } from '@/common/app/prisma.service';
import { LogicCenterService } from '@/common/api/logic.center.service';
import fs from 'node:fs';

@Injectable()
export class YDocInitializerService {
    private readonly pathToStorage = path.normalize(`${process.cwd()}/storage`);

    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly prismaService: PrismaService,
        private readonly appEnvironment: AppEnvironment,
        private readonly logicCenterService: LogicCenterService,
    ) {}

    async createYDocWithProvider(
        roomId: string,
        fileId: string,
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
        fileId: string,
    ): Promise<void> {
        // if (this.appEnvironment.getNodeEnv() === AppStateEnum.Development) {
        //     ydoc.getMap('root').set('key', 'some value');
        // } else {
        await this.loadWithDocxService(ydoc, fileId);
        // }
    }

    //TODO Должна быть загрузка из snapshot, но пока это не работает
    private async loadFromSnapshot(fileId: string) {
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

    private async loadWithDocxService(ydoc: Doc, fileId: string) {
        const fileInfo = await this.logicCenterService.getFileInfo(fileId);

        const buf = await this.logicCenterService.downloadFile(
            fileInfo.downloadUrl,
        );

        if (!(buf instanceof Buffer) && buf.status === false) {
            console.log(buf);
            throw new Error(fileInfo);
        }

        const pathToFile = `${this.pathToStorage}/${fileId}.docx`;

        fs.writeFileSync(pathToFile, <Buffer>buf);

        const documentService = new DocumentService();

        await documentService.openSystemUri(pathToFile);

        const adapter = new YsyncAdapterService();

        adapter.init(ydoc, documentService.getDocument());

        fs.unlinkSync(pathToFile);
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
