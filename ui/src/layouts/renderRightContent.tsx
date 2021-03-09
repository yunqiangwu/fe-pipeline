import React from 'react';
import { Avatar, Dropdown, Menu, Spin } from 'antd';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { useModel } from 'umi';
import { notification } from 'choerodon-ui';
import { setToken } from '@/utils/token'
import axios from 'axios';
import { Button, Modal, Output } from 'choerodon-ui/pro';
import { useAsyncFn } from 'react-use';
import { LabelLayoutType } from 'choerodon-ui/pro/lib/form/Form';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import './style.less';
import {
  DataSet,
  Form,
  TextField,
  Password,
} from 'choerodon-ui/pro';
import { ILayoutRuntimeConfig } from '../types/interface.d';
import { OtherAccountBind } from './other-account-bind';

const ModalContent = ({ modal, history, location }: any) => {

  const initialInfo = (useModel('initialState'));

  const formDS = React.useMemo(() => {
    // const type: FieldType = 'string' as FieldType;
    const ds = new DataSet({
      primaryKey: 'id',
      data: [
        initialInfo.initialState
      ],
      autoCreate: false,
      fields: [
        {
          name: 'username',
          // type,
          label: '账号',
          // required: true,
        },
        {
          name: 'email',
          // type,
          label: '邮箱',
          // required: true,
        },
        // {
        //   name: 'password',
        //   type,
        //   label: '修改密码',
        //   required: true,
        // },
        // {
        //   name: 'repassword',
        //   type,
        //   label: '确认密码',
        //   required: true,
        //   validator: async (value, _, record) => {
        //     if(value){
        //       const password = (record as any).get('password');
        //       if(password && value !== password) {
        //         return '两次密码不一致!';
        //       }
        //     }
        //     return;
        //   },
        // }
      ]
    });
    return ds;

  }, []);

  const [loginResponse, doChangePassword] = useAsyncFn(async () => {
    // if (await formDS.validate()) {
    //   try{
    //     const data = formDS.toData()[0]
    //     const res = await axios.post('/auth/change-password', {
    //       ...data,
    //     });
    //     notification.success({
    //       message: '密码修改成功',
    //       description: <pre>2 秒后, 请重新登录!</pre>,
    //     });
    //     setTimeout(() => {
    //       setToken(null);
    //       const { refresh } = initialInfo;
    //       refresh();
    //     }, 2000);
    //   }catch(err){
    //     const errorMsg = JSON.stringify(err.data || err.message);
    //     notification.error({
    //       message: '密码修改失败',
    //       description: <pre>{errorMsg}</pre>,
    //     });
    //     throw err;
    //   }
    // } else {
    //   return Promise.reject(false);
    // }
  }, []);


  modal.handleOk(() => {
    // return doChangePassword();
  });
  modal.handleCancel(() => {
    console.log('do Cancel');
    modal.close();
  });

  return (
    <div>
      <div className="login-form">
        <Form
          pristine
          onKeyDown={(e) => {
          if(e.key === 'Enter'){return doChangePassword()}
          } } dataSet={formDS}>
          <Output name="username" />
          <Output name="email" />
          {/* <Password name="password" />
          <Password name="repassword" /> */}
        </Form>
        <OtherAccountBind />
      </div>
    </div>
  );
};

export default function renderRightContent(
  runtimeLayout: ILayoutRuntimeConfig,
  loading: boolean,
  initialState: any,
  setInitialState: any,
) {
  if (runtimeLayout.rightRender) {
    return runtimeLayout.rightRender(
      initialState,
      setInitialState,
      runtimeLayout,
    );
  }

  const menu = (
    <Menu className="umi-plugin-layout-menu">
      <Menu.Item
        key="reset-password"
        onClick={
          () => {
            Modal.open({
              title: '用户信息',
              children: <ModalContent />,
            });
          }
        }
      >
        <SettingOutlined />
        用户信息
      </Menu.Item>
      <Menu.Item
        key="logout"
        onClick={() =>
          runtimeLayout.logout && runtimeLayout?.logout(initialState)
        }
      >
        <LogoutOutlined />
        退出登录
      </Menu.Item>
    </Menu>
  );

  const avatar = (
    <span className="umi-plugin-layout-action">
      <Avatar
        size="small"
        className="umi-plugin-layout-avatar"
        src={
          (initialState && initialState.avatar) ||
          'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'
        }
        alt="avatar"
      />
      <span className="umi-plugin-layout-name">
        {initialState && initialState.username}
      </span>
    </span>
  );

  if (loading) {
    return (
      <div className="umi-plugin-layout-right">
        <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
      </div>
    );
  }

  return (
    initialState && (
      <div className="umi-plugin-layout-right anticon">
        {runtimeLayout.logout ? (
          <Dropdown
            overlay={menu}
            overlayClassName="umi-plugin-layout-container"
          >
            {avatar}
          </Dropdown>
        ) : (
          avatar
        )}
      </div>
    )
  );
}
