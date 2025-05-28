import * as Y from 'yjs';
import { Snapshot } from 'yjs';
import { Injectable } from '@nestjs/common';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { PrismaService } from '@/common/app/prisma.service';
import { CreateVersionResponse } from '@/versions/responses/create.version.response';

@Injectable()
export class VersionRepository {
    constructor(private prisma: PrismaService) {}

    async createVersion(room: RoomDTO) {
        const lastVersion = await this.prisma.version.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
        });

        const ydoc = room.ydoc;
        const snapshot = Y.snapshot(ydoc);

        if (!lastVersion) {
            return await this.getResponseCreated(snapshot);
        } else {
            if (
                !Y.equalSnapshots(
                    Y.decodeSnapshot(lastVersion.snapshot),
                    snapshot,
                )
            ) {
                return await this.getResponseCreated(snapshot);
            } else {
                return {
                    id: lastVersion.id,
                    file_id: lastVersion.file_id,
                };
            }
        }
    }

    private async getResponseCreated(
        snapshot: Snapshot,
    ): Promise<CreateVersionResponse> {
        const created = await this.prisma.version.create({
            data: {
                file_id: 111,
                snapshot: Y.encodeSnapshot(snapshot),
            },
        });

        return { id: created.id, file_id: created.file_id };
    }

    createInterimVersion(room: RoomDTO) {}
}
