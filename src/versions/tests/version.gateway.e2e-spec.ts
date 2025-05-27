import { INestApplication } from '@nestjs/common';
import { AppTest } from '@/tests/app.test';
import { createSocket } from '@/tests/utils';
import { PrismaService } from '@/common/app/prisma.service';
import * as Y from 'yjs';

const path = 'versions';

describe('VersionGateway (integration)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let testRoomId: string;

    beforeAll(async () => {
        const appTestInstance = await AppTest.getInstance();
        app = appTestInstance.getApp();
        prisma = app.get<PrismaService>(PrismaService);
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

        socket.emit('saveVersion', testRoomId);

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
            } catch (err) {
                socket.close();
                done(err);
            }
        });
    });

    it.skip('should create new version when snapshots are different', async () => {
        const ydoc1 = new Y.Doc();
        const text1 = ydoc1.getText('content');
        text1.insert(0, 'First version');
        const snapshot1 = Y.snapshot(ydoc1);

        await prisma.version.create({
            data: {
                file_id: 111,
                snapshot: Y.encodeSnapshot(snapshot1),
            },
        });

        // Тестируем создание новой версии
        const socket = createSocket(path);

        return new Promise<void>((resolve, reject) => {
            socket.emit('saveVersion', testRoomId);

            socket.on('savedVersion', async (response) => {
                try {
                    expect(response).toHaveProperty('id');
                    expect(response).toHaveProperty('file_id', 111);

                    const versions = await prisma.version.findMany({
                        orderBy: { createdAt: 'desc' },
                    });

                    expect(versions.length).toBe(2);
                    expect(versions[0].id).toBe(response.id);

                    socket.close();
                    resolve();
                } catch (err) {
                    socket.close();
                    reject(err);
                }
            });
        });
    });

    it.skip('should return existing version when snapshots are equal', async () => {
        // Создаем тестовую версию
        const ydoc = new Y.Doc();
        const text = ydoc.getText('content');
        text.insert(0, 'Test content');
        const snapshot = Y.snapshot(ydoc);

        const createdVersion = await prisma.version.create({
            data: {
                file_id: 111,
                snapshot: Y.encodeSnapshot(snapshot),
            },
        });

        const socket = createSocket(path);

        return new Promise<void>((resolve, reject) => {
            socket.emit('saveVersion', testRoomId);

            socket.on('savedVersion', (response) => {
                try {
                    expect(response.id).toBe(createdVersion.id);
                    expect(response.file_id).toBe(createdVersion.file_id);

                    socket.close();
                    resolve();
                } catch (err) {
                    socket.close();
                    reject(err);
                }
            });
        });
    });
});
