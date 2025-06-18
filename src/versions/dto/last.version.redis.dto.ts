export interface InterimVersionsRedisDto {
    versions: InterimVersionRedisDto[];
}

export interface InterimVersionRedisDto {
    id: number;
    resourceId: string;
    state: Uint8Array;
}
