import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AbstractLoader } from './dev-proxy.loader';
import { devProxyProviders } from './dev-proxy.providers';

@Module({
  providers: [...devProxyProviders],
  imports: [HttpAdapterHost],
})
export class DevProxyModule implements OnModuleInit {

  constructor(
    private readonly loader: AbstractLoader,
    private readonly httpAdapterHost: HttpAdapterHost
  ) {
  }

  public async onModuleInit() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    this.loader.register(httpAdapter);
  }
}
