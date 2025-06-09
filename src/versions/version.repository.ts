import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/app/prisma.service';
import { RedisService } from '@/common/app/redis.service';
import {
    InterimVersionRedisDto,
    InterimVersionsRedisDto,
} from '@/versions/dto/last.version.redis.dto';
import { UpdateVersionDto } from '@/versions/dto/update.version.dto';

@Injectable()
export class VersionRepository {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) {}

    findAll() {
        return this.prisma.version.findMany();
    }

    findOne(id: number) {
        return this.prisma.version.findUnique({
            where: { id: Number(id) },
        });
    }

    removeOne(id: number) {
        return this.prisma.version.delete({ where: { id: Number(id) } });
    }

    update(id: number, updateVersionDto: UpdateVersionDto) {
        return this.prisma.version.update({
            where: { id: Number(id) },
            data: { name: updateVersionDto.name },
        });
    }

    async getLastVersion() {
        return this.prisma.version.findFirst({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createVersion(state: string, fileId: string, name?: string) {
        return this.prisma.version.create({
            data: {
                file_id: fileId,
                state,
                name: name
                    ? name
                    : `Новая версия ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`,
            },
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
        return await this.redisService.get<InterimVersionsRedisDto>(roomId);
    }

    async createInterimVersion(
        roomId: string,
        value: string | number | Buffer,
    ) {
        return this.redisService.set(roomId, value);
    }
}
