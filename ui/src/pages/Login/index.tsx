import * as React from 'react';
import axios from 'axios';
import { useModel } from 'umi';
import { notification, Spin, Alert } from 'choerodon-ui';
import { Button } from 'choerodon-ui/pro';
import { useAsyncFn, useAsync } from 'react-use';
import { setToken } from '@/utils/token'
import styles from './index.less';
import { RouteComponentProps } from 'react-router-dom';
import {
  DataSet,
  Form,
  TextField,
  Password,
} from 'choerodon-ui/pro';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { ButtonColor, ButtonType } from 'choerodon-ui/pro/lib/button/enum';
import { Size } from 'choerodon-ui/lib/_util/enum';
import OtherLogin from './OtherLogin';
import { LabelLayoutType } from 'choerodon-ui/pro/lib/form/Form';
import { DEFAULT_GITHUB_CLIENT_ID } from './constants';

const LoginPage: React.FC<RouteComponentProps> = (props) => {

  // const formDS = React.useMemo(() => {
  //   const type: FieldType = 'string' as FieldType;
  //   const ds = new DataSet({
  //     autoCreate: true,
  //     fields: [
  //       {
  //         name: 'username',
  //         type,
  //         label: '用户名',
  //         required: true,
  //       },
  //       {
  //         name: 'password',
  //         type,
  //         label: '密码',
  //         required: true,
  //       }
  //     ]
  //   });
  //   return ds;
  // }, []);


  return (
    <div className={styles['login-container']}>
      {/* <Spin spinning={loginResponse.loading}> */}
        <div className={styles['login-border']}>
          <div className={styles['login-wrapper']}>
            <h1 onClick={() => { props.history.replace(`/`); }} className={styles['login-title']}>ONLINE IDE</h1>
            {/* {loginResponse.error && <Alert className={styles['login-error']} type="error" message={loginResponse.error.message} />} */}
            {/* <div className={styles['login-form']}>
              <Form labelLayout={ "placeholder" as LabelLayoutType } onKeyDown={(e) => {
                if(e.key === 'Enter'){return doLogin()}
               } } dataSet={formDS}>
                <TextField name="username" />
                <Password name="password" />
              </Form>
            </div>
            <div className={styles['login-submit']}>
              <Button dataSet={formDS} onClick={() => doLogin()} type={"submit" as ButtonType} className={styles['submit-btn']} size={"large" as Size} color={ "primary" as ButtonColor}>
                登录
              </Button>
            </div> */}
            <OtherLogin />
          </div>
        </div>
      {/* </Spin> */}
    </div >
  )
}

export default LoginPage;

