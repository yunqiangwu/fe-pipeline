// import { HttpAdapterHost } from '@nestjs/core';
import { Provider } from '@nestjs/common';
import { AbstractLoader, WsProxyLoader } from './ws-proxy.loader';

export const WsProxyProviders: Provider[] = [
  {
    provide: AbstractLoader,
    useFactory: () => {
      return new WsProxyLoader();
    },
    // inject: [HttpAdapterHost],
  }
];