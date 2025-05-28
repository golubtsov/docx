import * as Y from 'yjs';
import { Snapshot } from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { PrismaService } from '@/common/app/prisma.service';
import { CreateVersionResponse } from '@/versions/responses/create.version.response';

@Injectable()
export class VersionRepository {
    constructor(private prisma: PrismaService) {}

    async getLastVersion() {
        return this.prisma.version.findFirst({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createVersion(snapshot: Snapshot, fileId: number) {
        return this.prisma.version.create({
            data: { file_id: fileId, snapshot: Y.encodeSnapshot(snapshot) },
        });
    }

    createInterimVersion(room: RoomDTO) {}
}
