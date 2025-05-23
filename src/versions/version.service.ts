import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { VersionRepository } from '@/versions/version.repository';

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
    saveVersion(roomId: string) {
        this.versionRepository.createVersion(
            this.roomRepository.getRoom(roomId),
        );
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
