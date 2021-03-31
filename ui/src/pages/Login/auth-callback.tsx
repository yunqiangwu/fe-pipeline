import * as React from 'react';
import axios from 'axios';
import { useModel } from 'umi';
import { notification, Spin, Alert } from 'choerodon-ui';
import * as querystring from 'querystring';
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

export interface AuthCallbackPageReactParams {
  host: string;
}

const AuthCallbackPage: React.FC<RouteComponentProps<AuthCallbackPageReactParams>> = (props) => {

  const [otherHandleLoading, setOtherHandleLoading] = React.useState(false);

  // const doLogin: any = React.useCallback((accessToken: string) => {
  //   console.log(accessToken);
  // }, []);

  const initialInfo = (useModel('initialState'));


  // const [otherHandleLoading, setOtherHandleLoading] = React.useState(false);
  const [loginResponse, doLogin] = useAsyncFn(async (existToken: string | undefined | null = null) => {
    if (existToken) {
      try {
        let access_token = existToken;
        // if(!access_token) {
        //   const data = formDS.toData()[0]
        //   const res = await axios.post('/auth/login', {
        //     ...data,
        //   });
        //   access_token = res.data.access_token;
        // }
        setToken(access_token);
        // const urlParams = new URLSearchParams(props.location.search);
        if (window.name === 'fe-pipeline-authConfigs') {
          if (window.opener) {
            window.opener.postMessage('refresh-authConfigs', `${window.location.protocol}//${window.location.host}`);
          }
          window.close();
        } else if (window.name === 'fe-pipeline-loginer') {
          if (window.opener) {
            window.opener.postMessage('fe-pipeline-loginer', `${window.location.protocol}//${window.location.host}`);
          }
          window.close();
        } else {
          const current_redirect_uri = localStorage.getItem('current_redirect_uri');
          if (current_redirect_uri) {
            localStorage.removeItem('current_redirect_uri');
            let gotoUrl = current_redirect_uri;
            if (gotoUrl.includes('?')) {
              gotoUrl = `${gotoUrl}&`;
            } else {
              gotoUrl = `${gotoUrl}?`;
            }
            gotoUrl = `${gotoUrl}access_token=${access_token}`;
            if (gotoUrl.startsWith('http')) {
              location.href = gotoUrl;
              return;
            } else {
              props.history.replace(gotoUrl);
            }
          } else {
            props.history.replace(`/`);
          }
        }
        setTimeout(() => {
          const { refresh } = initialInfo;
          refresh();
        }, 0);
      } catch (err) {
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
    const urlParams = querystring.parse(props.location.search.substring(1) + '&' + props.location.hash.substring(1));
    delete urlParams[""];
    const authHost = props.match.params.host;
    let redirect_uri = `${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}auth/${authHost}/callback`;
    const data: any = {
      ...urlParams,
      redirect_uri: redirect_uri,
      authHost,
    };
    try {
      // console.log(data);
      setOtherHandleLoading(true);
      const response = await axios.post((window.name === 'fe-pipeline-authConfigs' || (window as any).autoAuthClientId) ? '/auth/other-account-bind' : '/auth/other-login', data);
      setOtherHandleLoading(false)
      if (response.data.access_token) {
        setTimeout(() => {
          doLogin(response.data.access_token);
        }, 0);
      }
    } catch (e) {
      notification.error({
        message: e.message,
        description: '',
      });
    }
    // setOtherHandleLoading(false);
  }, []);

  return (
    <div className={styles['login-container']}>
      <Spin spinning={otherHandleLoading}>
        正在登陆...
      </Spin>
    </div >
  )
}

export default AuthCallbackPage;

