import axios, { AxiosRequestConfig } from 'axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { LogicCenterResponseErrorDto } from '@/common/api/logic.center.response.error.dto';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { DocumentService } from '@docxservice/documentservice';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { logicCenterUrlHelper } from '@/common/app/app.environment';

@Injectable()
export class LogicCenterService {
    private readonly LOGIC_CENTER_HOST = logicCenterUrlHelper();

    constructor() {}

    async getResourceInfo(
        id: string,
    ): Promise<any | LogicCenterResponseErrorDto> {
        return await this.sendRequest(
            `${this.LOGIC_CENTER_HOST}/resource/${id}`,
            {},
            'getResourceInfo',
        );
    }

    async getFileInfo(id: string): Promise<any | LogicCenterResponseErrorDto> {
        return await this.sendRequest(
            `${this.LOGIC_CENTER_HOST}/file/${id}`,
            {},
            'getFileInfo',
        );
    }

    //TODO упростить
    async updateFileFromYjs(room: RoomDTO): Promise<void> {
        try {
            const adap = new YsyncAdapterService();
            const componentInterface = adap.yToNode(room.ydoc.getMap('root'));

            const ds = new DocumentService();
            await ds.setInternalDocument(componentInterface);

            const blob = await ds.getBlob();

            const docxBlob =
                blob.type ===
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ? blob
                    : new Blob([blob], {
                          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      });

            const docxFile = new File([docxBlob], `${room.file_id}.docx`, {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            const formData = new FormData();
            formData.append('content', docxFile);

            const response = await axios.patch(
                `${this.LOGIC_CENTER_HOST}/resource/${room.file_id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    validateStatus: (status) => status < 500,
                },
            );

            if (response.status >= 200 && response.status < 300) {
                console.log(
                    '#LogicCenter DOCX файл загружен',
                    response.status,
                    response.data,
                );
            } else {
                console.warn(
                    '#LogicCenter Не удалось обновить файл',
                    response.status,
                    response.data,
                );
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error('Network error:', err.message);
                if (err.response) {
                    console.error(
                        'Server error:',
                        err.response.status,
                        err.response.data,
                    );
                }
            } else if (err instanceof Error) {
                console.error('Error:', err.message);
            } else {
                console.error('Unknown error');
            }
            throw err;
        }
    }

    async downloadFile(
        url: string,
    ): Promise<Buffer | LogicCenterResponseErrorDto> {
        return await this.sendRequest(
            url,
            {
                responseType: 'arraybuffer',
            },
            'downloadFile',
        );
    }

    private async sendRequest(
        url: string,
        config?: AxiosRequestConfig,
        parentMethod?: string,
    ): Promise<any | LogicCenterResponseErrorDto> {
        try {
            const response = await axios.get(url, config);

            if (response.status === HttpStatus.OK) {
                return response.data;
            }

            return {
                status: false,
                error: `LogicCenter обработал запрос, статус ответа - ${response.status}`,
                parentMethod,
            };
        } catch (err) {
            return {
                status: false,
                error: 'Ошибка при обращении в LogicCenter',
                parentMethod,
            };
        }
    }
}
