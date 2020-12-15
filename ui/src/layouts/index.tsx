import React, { useState, useEffect } from 'react';
import { Link, useModel, history } from 'umi';
import { notification } from 'choerodon-ui';
import ProLayout, { BasicLayoutProps } from '@ant-design/pro-layout';
import { SmileOutlined, HeartOutlined, CodepenCircleOutlined  } from '@ant-design/icons';
import './style.less';
import renderRightContent from './renderRightContent';
import { WithExceptionOpChildren } from '../components/Exception';
import { getMatchMenu, MenuDataItem, transformRoute } from '@umijs/route-utils';
import logo from '../components/logo';
import { setToken } from '@/utils/token';
import { ModalContainer as C7nModalContainer } from 'choerodon-ui/pro';
import { withRouter } from 'umi';

const WithRouterC7nModalContainer = (withRouter as any)(C7nModalContainer);

const getLayoutRender = (currentPathConfig: {
  layout:
    | {
        hideMenu: boolean;
        hideNav: boolean;
        hideFooter: boolean;
      }
    | false;
  hideFooter: boolean;
}) => {
  const layoutRender: any = {};

  if (currentPathConfig?.hideFooter) {
    layoutRender.footerRender = false;
  }

  if (currentPathConfig?.layout == false) {
    layoutRender.pure = true;
    return layoutRender;
  }

  if (currentPathConfig?.layout?.hideMenu) {
    layoutRender.menuRender = false;
  }

  if (currentPathConfig?.layout?.hideFooter) {
    layoutRender.footerRender = false;
  }

  if (currentPathConfig?.layout?.hideNav) {
    layoutRender.headerRender = false;
  }

  return layoutRender;
};

const IconMap = {
  smile: <SmileOutlined />,
  heart: <HeartOutlined />,
  codepen: <CodepenCircleOutlined />,
} as any;

const loopMenuItem = (menus: MenuDataItem[]): MenuDataItem[] =>
  menus.map(({ icon, children, ...item }) => ({
    ...item,
    icon: icon && IconMap[icon as string],
    children: children && loopMenuItem(children),
  }));

const BasicLayout = (props: any) => {
  const { children, location, route, ...restProps } = props;
  const initialInfo = (useModel('@@initialState'));

  const { initialState, setInitialState, loading, refresh, error } = initialInfo;
  const [currentPathConfig, setCurrentPathConfig] = useState<MenuDataItem>({});

  const userConfig = {
    logout: async () => {
      setToken(null);
      refresh();
    },
    title: 'VS Code Online',
    patchMenus: loopMenuItem,
  } as any;

  useEffect(() => {
    if(!initialState) {
      return;
    }
    if(initialState.username) {
      notification.success({
        message: '登录成功',
        description: `欢迎 ${initialState.username || ''}!`,
      });
    }
  }, [initialState]);

  useEffect(() => {
    if(!error) {
      return;
    }
    // notification.error({
    //   message: '登录失败',
    //   description: JSON.stringify(error.message),
    // });
    if(
      // (error as any).response.status === 401 && 
      !location.pathname.includes('/login')
      ) {
        history.replace(`/login?redirect_uri=${encodeURIComponent(window.location.href)}`);
    }
  }, [error]);


  useEffect(() => {
    const { menuData } = transformRoute(
      props?.route?.routes || [],
      undefined,
      undefined,
      true,
    );
    // 动态路由匹配
    const currentPathConfig = getMatchMenu(location.pathname, menuData).pop();
    setCurrentPathConfig(currentPathConfig || {});
  }, [location.pathname]);

  // layout 是否渲染相关
  const layoutRestProps: BasicLayoutProps & {
    rightContentRender?:
      | false
      | ((
          props: BasicLayoutProps,
          dom: React.ReactNode,
          config: any,
        ) => React.ReactNode);
  } = {
    itemRender: route => <Link to={route.path}>{route.breadcrumbName}</Link>,
    ...userConfig,
    ...restProps,
    ...getLayoutRender(currentPathConfig as any),
  };

  return (
    <ProLayout
      route={route}
      loading={loading}
      location={location}
      title={userConfig.name || userConfig.title}
      className="umi-plugin-layout-main"
      navTheme="dark"
      siderWidth={256}
      onMenuHeaderClick={e => {
        e.stopPropagation();
        e.preventDefault();
        history.push('/');
      }}
      menu={{ locale: userConfig.locale }}
      // 支持了一个 patchMenus，其实应该用 menuDataRender
      menuDataRender={
        userConfig.patchMenus
          ? menuData => userConfig.patchMenus(menuData, initialInfo)
          : undefined
      }
      logo={logo}
      menuItemRender={(menuItemProps, defaultDom) => {
        if (menuItemProps.isUrl || menuItemProps.children) {
          return defaultDom;
        }
        if (menuItemProps.path) {
          return <Link to={menuItemProps.path}>{defaultDom}</Link>;
        }
        return defaultDom;
      }}
      disableContentMargin
      fixSiderbar
      fixedHeader
      {...layoutRestProps}
      rightContentRender={
        // === false 应该关闭这个功能
        layoutRestProps?.rightContentRender !== false &&
        (layoutProps => {
          const dom = renderRightContent(
            userConfig,
            loading,
            initialState,
            setInitialState,
          );
          if (layoutRestProps.rightContentRender) {
            return layoutRestProps.rightContentRender(layoutProps, dom, {
              userConfig,
              loading,
              initialState,
              setInitialState,
            });
          }
          return dom;
        })
      }
    >
      <WithRouterC7nModalContainer />
      <WithExceptionOpChildren
        noFound={userConfig?.noFound}
        unAccessible={userConfig?.unAccessible}
        currentPathConfig={currentPathConfig}
      >
        {userConfig.childrenRender
          ? userConfig.childrenRender(children)
          : children}
      </WithExceptionOpChildren>
    </ProLayout>
  );
};

export default BasicLayout;
