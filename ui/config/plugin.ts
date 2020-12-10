// ref:
// - https://umijs.org/plugins/api
import { IApi } from '@umijs/types';
import { resolve } from 'path';

// 配置类型{name: string, path: string}

export default function (api: IApi) {
  api.addRuntimePlugin(() => [resolve(__dirname, `./C7nProviderRuntime.tsx`)]);
}
