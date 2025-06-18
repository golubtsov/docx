import { IsIn, IsOptional, IsString } from 'class-validator';

const orderByParams = ['id', 'createdAt', 'updatedAt', 'name'];

const orderParams = ['desc', 'asc'];

export class VersionParamsDto {
    @IsOptional()
    @IsString()
    @IsIn(orderByParams, {
        message: `Значение orderBy должно быть ${orderByParams}`,
    })
    orderBy: string = orderByParams[0];

    @IsOptional()
    @IsString()
    @IsIn(orderParams, {
        message: `Значение order должно быть ${orderParams}`,
    })
    order: string = orderParams[0];

    @IsString({
        message: 'Поле resourceId обязательное для заполнения',
    })
    resourceId?: string;
}
