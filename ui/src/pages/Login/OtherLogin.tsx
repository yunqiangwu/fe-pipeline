import * as React from 'react';
import axios from 'axios';
import { useAsync, useAsyncFn } from 'react-use';
import {
  useLocation
} from "react-router-dom";
import { DEFAULT_GITHUB_CLIENT_ID } from './constants';
import { Row, Col, Alert } from 'choerodon-ui';
import { Spin } from 'choerodon-ui/pro/lib';
import styles from './index.less';


type AuthConfig = {
  "id": string,
  "host": string,
  "protocol": string,
  "type": string,
  "oauth": {
    "clientId": string,
    "clientSecret": string,
    "callBackUrl": string,
    "settingsUrl": string,
    "authUrl": string
  }
};

const OtherLogin = () => {

  let location = useLocation();

  const isAtIframe = React.useMemo(() => {
    return window !== window.parent;
  }, []);

  const autoAuthClientId = React.useMemo(() => {
    const pa = new URLSearchParams(location.search);
    const current_redirect_uri = pa.get('redirect_uri');
    if (current_redirect_uri) {
      localStorage.setItem('current_redirect_uri', current_redirect_uri);
    }
    return pa.get('autoAuthClientId');
  }, [location.search]);

  const authConfigs = useAsync(async () => {
    const response = await axios.get('/auth/oauth-config');
    return response.data;
  });

  React.useEffect(() => {

    const lis = function(event: MessageEvent) {
      // console.log('message', event);
      if(event.data === 'fe-pipeline-loginer') {
        const current_redirect_uri = localStorage.getItem('current_redirect_uri');
        if (current_redirect_uri) {
          localStorage.removeItem('current_redirect_uri');
          window.location.href = current_redirect_uri;
          // let gotoUrl = current_redirect_uri;
          // if (gotoUrl.includes('?')) {
          //   gotoUrl = `${gotoUrl}&`;
          // } else {
          //   gotoUrl = `${gotoUrl}?`;
          // }
          // gotoUrl = `${gotoUrl}access_token=${access_token}`;
          // if (gotoUrl.startsWith('http')) {
          //   return;
          // } else {
          //   props.history.replace(gotoUrl);
          // }
        }
      }
    };

    window.addEventListener('message', lis);

    return () => {
      window.removeEventListener('message', lis);
    };

  }, []);

  if(authConfigs.loading) {
    return <div style={{margin: "0 auto"}}><Spin /></div>
  }

  if(authConfigs.error) {
    return <Alert message={authConfigs.error.message} />;
  }

  return (
    <div className={styles['other-login']}>
      <Row className={styles['other-login-line']}>
        <Col>
          <span>登录</span>
        </Col>
      </Row>
      <div className={styles['other-login-content']}>
        {
          (authConfigs.value as AuthConfig[]).map((authConfig, index) => {

            let authUrl = '/'

            if(authConfig.oauth.authUrl) {
              authUrl = `${authConfig.oauth.authUrl}`;
              let redirect_uri = `${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}auth/${authConfig.host}/callback`;
              authUrl = `${authConfig.oauth.authUrl}${authConfig.oauth.authUrl.includes('?') ? '&' : '?'}redirect_uri=${redirect_uri}`
            }

            if(isAtIframe) {
              const doLogin = () => {
                console.log(authUrl);
                const win = window.open(authUrl,'fe-pipeline-loginer', 'width=400,height=400');
              }
              if(autoAuthClientId === authConfig.id) {
                setTimeout(() => {
                  doLogin();
                }, 0)
              }
              return (
                <div className={styles['other-login-col']} key={`k_${index}`}>
                  <div onClick={doLogin} className={styles['other-login-item']}>
                    <div style={{height: 40, width: 40}} />
                    <span className={styles['other-login-item-desc']}>{authConfig.id}</span>
                  </div>
                </div>
              );
            } else {
              if(autoAuthClientId === authConfig.id) {
                setTimeout(() => {
                  window.location.href = authUrl;
                }, 0)
              }
              return (
                <div className={styles['other-login-col']} key={`k_${index}`}>
                  <a href={authUrl} className={styles['other-login-item']}>
                    {/* <div style={{height: 40, width: 40}} /> */}
                    <span className={styles['other-login-item-desc']}>{authConfig.id}</span>
                  </a>
                </div>
              );
            }
          })
        }
      </div>
    </div>
  );
};

export default OtherLogin;
