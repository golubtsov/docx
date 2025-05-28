import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { VersionRepository } from '@/versions/version.repository';
import * as Y from 'yjs';

@Injectable()
export class VersionService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly versionRepository: VersionRepository,
    ) {}

    /**
     * Сохранить новую версию документа
     * При удалении комнаты (выходе владельца? или др. действие?) сохраняется новая версия документа,
     * сохраняется снапшот между версиями в sql-бд
     */
    async saveVersion(roomId: string) {
        const room = this.roomRepository.getRoom(roomId);
        const snapshot = Y.snapshot(room.ydoc);
        const lastVersion = await this.versionRepository.getLastVersion();

        if (
            !lastVersion ||
            !Y.equalSnapshots(Y.decodeSnapshot(lastVersion.snapshot), snapshot)
        ) {
            const version = await this.versionRepository.createVersion(
                snapshot,
                111,
            );
            return { id: version.id, file_id: version.file_id };
        }
        return lastVersion;
    }

    /**
     * Сохранить промежуточную версию документа
     * Промежуточная версия - версия, которая создается в комнате при редактировании
     * документа, не сохраняется в sql-бд, сохраняется в кэш
     */
    saveInterimVersion(roomId: string) {
        this.versionRepository.createInterimVersion(
            this.roomRepository.getRoom(roomId),
        );
    }
}
