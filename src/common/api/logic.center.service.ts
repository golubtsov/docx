import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
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

    async updateFileFromYjs(room: RoomDTO): Promise<void> {
        try {
            const adapter = new YsyncAdapterService();
            const componentInterface = adapter.yToNode(
                room.ydoc.getMap('root'),
            );

            const ds = new DocumentService();
            await ds.setInternalDocument(componentInterface);

            const blob = await ds.getBlob();

            const docxFile = this.getDocxFileFromBlob(blob, room);

            const response = await this.updateResource(room, docxFile);

            this.logResponse(response);
        } catch (err: unknown) {
            throw err;
        }
    }

    private async updateResource(room: RoomDTO, docxFile: File) {
        const formData = new FormData();
        formData.append('content', docxFile);

        return await axios.patch(
            `${this.LOGIC_CENTER_HOST}/resource/${room.resourceId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
    }

    private logResponse(response: AxiosResponse) {
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
    }

    private getDocxFileFromBlob(blob: Blob, room: RoomDTO) {
        const docxBlob =
            blob.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ? blob
                : new Blob([blob], {
                      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  });

        return new File([docxBlob], `${room.resourceId}.docx`, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
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
