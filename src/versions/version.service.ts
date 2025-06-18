import {
    applyUpdate,
    Doc,
    encodeStateAsUpdate,
    equalSnapshots,
    snapshot,
} from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { VersionRepository } from '@/versions/version.repository';
import { UpdateVersionDto } from '@/versions/dto/update.version.dto';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { CreateVersionResponse } from '@/versions/responses/create.version.response';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { InterimVersionsRedisDto } from '@/versions/dto/last.version.redis.dto';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { VersionParamsDto } from '@/versions/dto/version.params.dto';

@Injectable()
export class VersionService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly versionRepository: VersionRepository,
        private readonly logicCenterService: LogicCenterService,
    ) {}

    findAll(params: VersionParamsDto) {
        return this.versionRepository.findAll(params);
    }

    findOne(id: number) {
        return this.versionRepository.findOne(id);
    }

    removeOne(id: number) {
        return this.versionRepository.removeOne(id);
    }

    update(id: number, updateVersionDto: UpdateVersionDto) {
        return this.versionRepository.update(id, updateVersionDto);
    }

    /**
     * Сохранить новую версию документа,
     * сохраняется снапшот между версиями в sql-бд
     */
    async saveVersion(
        fileId: string,
        name?: string,
    ): Promise<CreateVersionResponse> {
        const room = this.roomRepository.getRoomByFileId(fileId);

        const lastVersion = await this.versionRepository.getLastVersion();

        if (!lastVersion) {
            const version = await this.createVersion(room, name);

            await this.logicCenterService.updateFileFromYjs(room);

            return this.getCreateVersionResponse(
                version,
                'Создана новая версия',
            );
        } else {
            if (this.isEqualSnapshots(lastVersion, room)) {
                return this.getCreateVersionResponse(
                    lastVersion,
                    'Нет изменений в текущем документе, версия не создана',
                );
            } else {
                const version = await this.createVersion(room, name);

                await this.logicCenterService.updateFileFromYjs(room);

                return this.getCreateVersionResponse(
                    version,
                    'Создана последующая версия',
                );
            }
        }
    }

    private async createVersion(room: RoomDTO, name?: string) {
        return await this.versionRepository.createVersion(
            this.getStateFromYDocInBase64(room.ydoc),
            room.fileId,
            name,
        );
    }

    private isEqualSnapshots(lastVersion: any, room: RoomDTO) {
        const decodeState = toUint8Array(lastVersion.state);

        const newYdoc = new Doc();

        applyUpdate(newYdoc, decodeState);

        const oldSnapshot = snapshot(room.ydoc);

        const newSnapshot = snapshot(newYdoc);

        return equalSnapshots(oldSnapshot, newSnapshot);
    }

    private getCreateVersionResponse(version: any, message: string) {
        return {
            id: version.id,
            fileId: version.file_id,
            name: version.name,
            message: message,
        };
    }

    /**
     * Сохранить промежуточную версию документа
     * Промежуточная версия - версия, которая создается в комнате при редактировании
     * документа, не сохраняется в sql-бд, сохраняется в кэш
     */
    async saveInterimVersion(fileId: string) {
        const room = this.roomRepository.getRoomByFileId(fileId);

        const previousVersions =
            await this.versionRepository.getInterimVersions(room.id);

        return await this.createNewInterimVersion(room, previousVersions);
    }

    private async createNewInterimVersion(
        room: RoomDTO,
        previousVersions?: InterimVersionsRedisDto,
    ) {
        const isFirstVersion = !previousVersions;
        const version = this.createVersionObject(
            room,
            isFirstVersion ? null : previousVersions,
        );

        const versions = {
            versions: isFirstVersion
                ? [version]
                : [...previousVersions.versions, version],
        };

        await this.versionRepository.createInterimVersion(
            room.id,
            JSON.stringify(versions),
        );

        return {
            message: isFirstVersion
                ? 'Первая промежуточная версия'
                : 'Новая промежуточная версия',
            version,
        };
    }

    private createVersionObject(
        room: RoomDTO,
        previousVersions?: InterimVersionsRedisDto | null,
    ) {
        //TODO VersionRepository.getLastInterimVersion()
        const lastVersion =
            previousVersions?.versions[previousVersions.versions.length - 1];

        return {
            id: lastVersion ? lastVersion.id + 1 : 1,
            file_id: lastVersion?.fileId ?? room.fileId,
            state: this.getStateFromYDocInBase64(room.ydoc),
        };
    }

    private getStateFromYDocInBase64(ydoc: Doc) {
        const stateAsUpdate = encodeStateAsUpdate(ydoc);

        return fromUint8Array(stateAsUpdate);
    }
}
