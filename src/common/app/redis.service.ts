import { Injectable } from '@nestjs/common';
import Redis, { RedisKey } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor(private configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            db: 0,
        });
    }

    set(key: RedisKey, value: string | Buffer | number) {
        return this.redis.set(key, value);
    }

    async get<T>(key: RedisKey): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            return data ? (JSON.parse(data) as T) : null;
        } catch (error) {
            throw new Error(`Failed to get or parse key ${key}: ${error}`);
        }
    }

    delete(...keys: RedisKey[]) {
        return this.redis.del(keys);
    }
}
