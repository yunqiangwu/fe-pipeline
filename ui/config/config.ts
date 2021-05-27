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
      // component: '@/pages/workspaces/create-temp-ws',
      redirect: '/app',
    },
    // {
    //   path: '/ws-demo',
    //   component: '@/pages/workspaces/demo',
    //   icon: 'codepen', name: "Demo",
    //   // redirect: '/app',
    // },
    // {
    //   path: '/ws-demo-dev',
    //   component: '@/pages/workspaces/demo-dev',
    //   icon: 'codepen', name: "Demo2",
    //   // redirect: '/app',
    // },
    {
      path: '/app',
      component: '@/layouts',
      routes: [
        {
          path: '/app',
          redirect: '/app/ms',
        },
        { path: '/app/ms',  component: '@/pages/ms',
          icon: 'heart', name: "空间管理",
        },
        { path: '/app/ms/detail/:id',  component: '@/pages/ms/detail',
          // icon: 'heart', name: "空间管理-详情",
        },
        { path: '/app/gitlab-repo',  component: '@/pages/gitlab-repo',
          icon: 'codepen', name: "仓库浏览",
        },
      //   { path: '/app/repos',  component: '@/pages/repos',
      //   icon: 'codepen', name: "代码仓库",
      //  },
      ],
    },
    { path: "/login", name: "Login", component: '@/pages/Login' },
    { path: "/auth/:host/callback", name: "AuthCallback", component: '@/pages/Login/auth-callback' },
    
    // { path: "/ws-pod1/:id", name: "ws-pod", component: '@/pages/Home' },
    // { path: "/ws-pod/:id", name: "ws-pod", component: '@/pages/workspaces/ws-loading' },
  ],
});
