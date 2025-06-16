import fs from 'node:fs';
import path from 'node:path';
import { applyUpdate, Doc } from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { WebsocketProvider } from 'y-websocket';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { VersionRepository } from '@/versions/version.repository';
import { toUint8Array } from 'js-base64';

@Injectable()
export class YDocInitializerService {
    private readonly pathToStorage = path.normalize(`${process.cwd()}/storage`);

    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly logicCenterService: LogicCenterService,
        private readonly versionRepository: VersionRepository,
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
        const version = await this.versionRepository.getLastVersion();

        if (version) {
            this.loadFromState(ydoc, version);
        } else {
            await this.loadWithDocxService(ydoc, fileId);
        }
    }

    private loadFromState(ydoc: Doc, version: any) {
        const decodeState = toUint8Array(version.state);

        applyUpdate(ydoc, decodeState);
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

        adapter.nodeToY(
            documentService.getInternalDocument(),
            ydoc.getMap('root'),
        );

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
