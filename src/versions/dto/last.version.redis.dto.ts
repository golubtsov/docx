export interface InterimVersionsRedisDto {
    versions: InterimVersionRedisDto[];
}

export interface InterimVersionRedisDto {
    id: number;
    fileId: number;
    state: Uint8Array;
}
