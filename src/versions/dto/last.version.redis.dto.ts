export interface InterimVersionsRedisDto {
    versions: InterimVersionRedisDto[];
}

export interface InterimVersionRedisDto {
    id: number;
    file_id: number;
    snapshot: Uint8Array;
}
