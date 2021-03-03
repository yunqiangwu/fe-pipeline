import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AbstractLoader } from './ws-proxy.loader';
import { WsProxyProviders } from './ws-proxy.providers';

@Module({
  providers: [...WsProxyProviders],
  imports: [HttpAdapterHost],
})
export class WsProxyModule implements OnModuleInit {

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
