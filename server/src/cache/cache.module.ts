import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, CACHE_MANAGER, Module } from '@nestjs/common';
import { Config } from 'src/config/config';

@Module({
    imports: [
        CacheModule.registerAsync({
          useFactory: () => ({
            store: redisStore,
            host: Config.singleInstance().get('redis.endpoint_ip'),  // 'localhost',
            port: Config.singleInstance().get('redis.endpoint_port'),  //6379,
            ttl: 999,
          }),
        }),
    ],
    exports: [CacheModule],
})
export class MyCacheModule {}
