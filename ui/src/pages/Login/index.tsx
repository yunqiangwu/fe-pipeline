import * as React from 'react';
import axios from 'axios';
import { useModel } from 'umi';
import { notification, Spin, Alert } from 'choerodon-ui';
import { Button } from 'choerodon-ui/pro';
import { useAsyncFn, useAsync } from 'react-use';
import { setToken } from '@/utils/token'
import './index.less';
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

  const formDS = React.useMemo(() => {
    const type: FieldType = 'string' as FieldType;
    const ds = new DataSet({
      autoCreate: true,
      fields: [
        {
          name: 'username',
          type,
          label: '用户名',
          required: true,
        },
        {
          name: 'password',
          type,
          label: '密码',
          required: true,
        }
      ]
    });
    return ds;
  }, []);

  const initialInfo = (useModel('@@initialState'));

  const [otherHandleLoading, setOtherHandleLoading] = React.useState(false);
  const [loginResponse, doLogin] = useAsyncFn(async (existToken: string | undefined | null = null) => {
    if (existToken || await formDS.validate()) {
      try{
        let access_token = existToken;
        if(!access_token) {
          const data = formDS.toData()[0]
          const res = await axios.post('/auth/login', {
            ...data,
          });
          access_token = res.data.access_token;
        }
        setToken(access_token);
        const urlParams = new URLSearchParams(props.location.search);
        const current_redirect_uri = urlParams.get('redirect_uri');
        if(current_redirect_uri) {
          if(current_redirect_uri.startsWith('http')) {
            location.href=`${current_redirect_uri}`;
            return;
          } else {
            props.history.replace(current_redirect_uri);
          }
        } else {
          props.history.replace(`/app`);
        }
        setTimeout(() => {
          const { refresh } = initialInfo;
          refresh();
        }, 0);
      }catch(err){
        const errorMsg = JSON.stringify(err.data || err.message);
        notification.error({
          message: '登录失败',
          description: <pre>{errorMsg}</pre>,
        });
        throw err;
      }
    } else {
      return {};
    }
  }, []);

  useAsync(async () => {
    const urlParams = new URLSearchParams(props.location.search+props.location.hash.replace('#', '&'));
    const redirect_uri = urlParams.get('redirect_uri');
    const access_token = urlParams.get('access_token');
    const github_code = urlParams.get('code');
    const github_state = urlParams.get('state');
    const loginType = urlParams.get('login-type');

    if(access_token || (loginType === 'github' && github_code)) {
      setOtherHandleLoading(true);
      if(loginType) {
        const data : any = {
          redirect_uri,
          loginType,
          access_token,
        };
        try{
          if(loginType === 'github') {
            data.access_token = github_code;
            data.state = github_state;
          }
          const response = await axios.post('/auth/other-login', data);
          if(response.data.access_token){
            setTimeout(() => {
              doLogin(response.data.access_token);
            }, 0);
          }
        }catch(e) {
          notification.error({
            message: e.message,
            description: '',
          });
        }
      } else {
        const access_token = urlParams.get('access_token');
        doLogin(access_token);
      }
    }
    setOtherHandleLoading(false);
  }, []);

  return (
    <div className="login-container">
      <Spin spinning={loginResponse.loading || otherHandleLoading}>
        <div className="login-border">
          <div className="login-wrapper">
            <h1 className="login-title">登录</h1>
            {loginResponse.error && <Alert className="login-error" type="error" message={loginResponse.error.message} />}
            <div className="login-form">
              <Form labelLayout={ "placeholder" as LabelLayoutType } onKeyDown={(e) => { 
                if(e.key === 'Enter'){return doLogin()}
               } } dataSet={formDS}>
                <TextField name="username" />
                <Password name="password" />
              </Form>
            </div>
            <div className="login-submit">
              <Button dataSet={formDS} onClick={() => doLogin()} type={"submit" as ButtonType} className="submit-btn" size={"large" as Size} color={ "primary" as ButtonColor}>
                登录
              </Button>
            </div>
            <OtherLogin location={props.location} />
          </div>
        </div>
      </Spin>
    </div >
  )
}

export default LoginPage;

