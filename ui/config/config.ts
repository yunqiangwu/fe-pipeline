import path from 'path';
import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.API_BASE_PATH': process.env.API_BASE_PATH || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : '/'),
    'process.env.API_WEBSOCKET': process.env.API_WEBSOCKET,
  },

  // base: process.env.NODE_ENV === 'development' ? '/' : '/app/',
  // publicPath: process.env.NODE_ENV === 'development' ? '/' : '/app/',

  base: process.env.FED_BASE_PATH, // '/app/',
  publicPath: process.env.FED_PUBLIC_PATH, // '/app/',

  plugins: [path.resolve(__dirname, './plugin.ts')],
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'choerodon-ui',
        libraryDirectory: 'es',
        style: true,
      },
      'c7n',
    ],
    [
      'import',
      {
        libraryName: 'choerodon-ui/pro',
        libraryDirectory: 'es',
        style: true,
      },
      'c7n-pro',
    ]
  ],
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    {
      path: '/oauth2-redirect.html',
      component: '@/pages/other/redirect-to-swagger-ui',
    },
    {
      path: '/swagger-ui/oauth2-redirect.html',
      component: '@/pages/other/redirect-to-swagger-ui',
    },
    {
      path: '/',
      component: '@/pages/workspaces/create-temp-ws',
      // redirect: '/app',
    },
    {
      path: '/app',
      component: '@/layouts',
      routes: [
        {
          path: '/app',
          redirect: '/app/workspaces',
        },
        { path: '/app/workspaces',  component: '@/pages/workspaces',
         icon: 'codepen', name: "空间管理",
        },
      ],
    },
    { path: "/login", name: "Login", component: '@/pages/Login' },
    { path: "/auth/:host/callback", name: "AuthCallback", component: '@/pages/Login/auth-callback' },
    { path: "/ws-pod1/:id", name: "ws-pod", component: '@/pages/Home' },
    { path: "/ws-pod/:id", name: "ws-pod", component: '@/pages/workspaces/ws-loading' },
  ],
});
