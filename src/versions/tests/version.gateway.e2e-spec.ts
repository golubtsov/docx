import { INestApplication } from '@nestjs/common';
import { AppTest } from '@/tests/app.test';
import { createSocket } from '@/tests/utils';
import { PrismaService } from '@/common/app/prisma.service';

const path = 'versions';

describe('VersionGateway (integration)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let appTestInstance: AppTest;

    beforeAll(async () => {
        appTestInstance = await AppTest.getInstance();
        app = appTestInstance.getApp();
        prisma = app.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        appTestInstance.clearAllConnections();
    });

    beforeEach(async () => {
        await prisma.version.deleteMany();
    });

    afterAll(async () => {
        await prisma.version.deleteMany();
        await app.close();
    });

    it('should create new version when no versions exist', (done) => {
        const socket = createSocket(path);

        socket.emit('saveVersion', 'testRoomId');

        socket.on('savedVersion', async (response) => {
            try {
                expect(response).toHaveProperty('id');
                expect(response).toHaveProperty('file_id', 111);

                const version = await prisma.version.findUnique({
                    where: { id: response.id },
                });

                expect(version).toBeDefined();
                expect(version?.file_id).toBe(111);

                socket.close();
                done();
            } catch (err: any) {
                socket.close();
                done.fail(err);
            }
        });
    });
});
