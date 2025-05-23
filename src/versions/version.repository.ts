import { Injectable } from '@nestjs/common';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class VersionRepository {
    async createVersion(room: RoomDTO) {
        const provider = room.provider;
        const prisma = new PrismaClient();

        const lastVersion = await prisma.version.last();

        console.log(lastVersion);
    }

    createInterimVersion(room: RoomDTO) {}
}
