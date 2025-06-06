import axios, { AxiosRequestConfig } from 'axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { LogicCenterResponseErrorDto } from '@/common/api/logic.center.response.error.dto';

@Injectable()
export class LogicCenterService {
    private readonly LOGIC_CENTER_HOST = 'http://10.0.7.181/logiccenter';

    constructor() {}

    async getFileInfo(id: string): Promise<any | LogicCenterResponseErrorDto> {
        return await this.sendRequest(
            `${this.LOGIC_CENTER_HOST}/file/${id}`,
            {},
            'getFileInfo',
        );
    }

    uploadFile() {}

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
        method?: string,
    ): Promise<any | LogicCenterResponseErrorDto> {
        try {
            const response = await axios.get(url, config);

            if (response.status === HttpStatus.OK) {
                return response.data;
            }

            return {
                status: false,
                error: `LogicCenter обработал запрос, статус ответа - ${response.status}`,
                method,
            };
        } catch (err) {
            return {
                status: false,
                error: 'Ошибка при обращении в LogicCenter',
                method,
            };
        }
    }
}
