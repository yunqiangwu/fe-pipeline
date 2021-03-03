// import { HttpAdapterHost } from '@nestjs/core';
import { Provider } from '@nestjs/common';
import { AbstractLoader, DevProxyLoader } from './dev-proxy.loader';

export const devProxyProviders: Provider[] = [
  {
    provide: AbstractLoader,
    useFactory: () => {
      return new DevProxyLoader();
    },
    // inject: [HttpAdapterHost],
  }
];