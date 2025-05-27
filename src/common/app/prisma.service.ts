import { Injectable, OnModuleInit } from '@nestjs/common';
// prisma-comment: Должно быть так, но так не работает
// import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
