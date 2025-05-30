import * as Y from 'yjs';
import { Snapshot } from 'yjs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/app/prisma.service';
import { RedisService } from '@/common/app/redis.service';
import {
    InterimVersionRedisDto,
    InterimVersionsRedisDto,
} from '@/versions/dto/last.version.redis.dto';

@Injectable()
export class VersionRepository {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) {}

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

    async getLastInterimVersion(
        roomId: string,
    ): Promise<InterimVersionRedisDto> {
        const data =
            await this.redisService.get<InterimVersionsRedisDto>(roomId);
        return data ? data.versions[data.versions.length - 1] : null;
    }

    async getInterimVersions(roomId: string) {
        return this.redisService.get<InterimVersionsRedisDto>(roomId);
    }

    async createInterimVersion(
        roomId: string,
        value: string | number | Buffer,
    ) {
        return this.redisService.set(roomId, value);
    }
}
