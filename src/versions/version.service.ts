import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { VersionRepository } from '@/versions/version.repository';
import { Snapshot } from 'yjs';
import { InterimVersionRedisDto } from '@/versions/dto/last.version.redis.dto';
import { RoomDTO } from '@/rooms/dto/room.dto';

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
    async saveInterimVersion(roomId: string) {
        const room = this.roomRepository.getRoom(roomId);
        const snapshot = Y.snapshot(room.ydoc);
        const lastInterimVersion =
            await this.versionRepository.getLastInterimVersion(room.id);

        if (lastInterimVersion) {
            const uint8Array = this.generateUint8Array(lastInterimVersion);

            if (
                !this.isEqualSnapshots(Y.decodeSnapshot(uint8Array), snapshot)
            ) {
                return await this.createNewInterimVersion(
                    room,
                    lastInterimVersion,
                    snapshot,
                );
            } else {
                return {
                    message: 'last interim version',
                    version: lastInterimVersion,
                };
            }
        } else {
            return await this.createFirstInterimVersion(room, snapshot);
        }
    }

    private generateUint8Array(version: InterimVersionRedisDto) {
        const length = Object.keys(version.snapshot).reduce(
            (max, key) => Math.max(max, parseInt(key, 10) + 1),
            0,
        );

        const uint8Array = new Uint8Array(length);
        Object.entries(version.snapshot).forEach(([key, value]) => {
            uint8Array[parseInt(key, 10)] = value;
        });

        return uint8Array;
    }

    private isEqualSnapshots(fist: Snapshot, second: Snapshot) {
        return Y.equalSnapshots(fist, second);
    }

    private async createNewInterimVersion(
        room: RoomDTO,
        lastInterimVersion: InterimVersionRedisDto,
        snapshot: Snapshot,
    ) {
        const previousVersions =
            await this.versionRepository.getInterimVersions(room.id);

        const id = lastInterimVersion.id + 1;

        const version = {
            id,
            file_id: lastInterimVersion.file_id,
            snapshot: Y.encodeSnapshot(snapshot),
        };

        const versions = {
            versions: [...previousVersions.versions, version],
        };

        await this.versionRepository.createInterimVersion(
            room.id,
            JSON.stringify(versions),
        );

        return { message: 'new interim version', version };
    }

    private async createFirstInterimVersion(room: RoomDTO, snapshot: Snapshot) {
        const version = {
            id: 1,
            file_id: 111,
            snapshot: Y.encodeSnapshot(snapshot),
        };

        const versions = {
            versions: [version],
        };

        await this.versionRepository.createInterimVersion(
            room.id,
            JSON.stringify(versions),
        );

        return { message: 'first interim version', version };
    }
}
