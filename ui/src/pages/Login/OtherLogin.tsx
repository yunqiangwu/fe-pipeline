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

            if(autoAuthClientId === authConfig.id) {
              setTimeout(() => {
                window.location.href = authUrl;
              }, 0)
            }

            return (
              <div className={styles['other-login-col']} key={`k_${index}`}>
                <a href={authUrl} className={styles['other-login-item']}>
                  <div style={{height: 40, width: 40}} />
                  {/* <img src={require('./assets/choerodon_logo.svg')} alt="choerodon" className={styles['other-login-item-img']} /> */}
                  <span className={styles['other-login-item-desc']}>{authConfig.id}</span>
                </a>
              </div>
            );
            // return <div key={`k_${index}`}>
            //   {index}
            // </div>
          })
        }
        {/* <Col span={8}>
          <div onClick={() => otherLoginHandle('choerodon')} className={styles['other-login-item']}>
            <img src={require('./assets/choerodon_logo.svg')} alt="choerodon" className={styles['other-login-item-img']} />
            <span className={styles['other-login-item-desc']}>Choerodon</span>
          </div>
        </Col>
        <Col span={8}>
          <div onClick={() => otherLoginHandle('open-hand')} className={styles['other-login-item']}>
            <img src={require('./assets/open-hand-logo2.png')} alt="open-hand" className={styles['other-login-item-img']} />
            <span className={styles['other-login-item-desc']}>汉得开发平台</span>
          </div>
        </Col>
        <Col span={8}>
          <div onClick={() => otherLoginHandle('github')} className={styles['other-login-item']}>
            <img src={require('./assets/gitlab-logo.svg')} alt="github" className={styles['other-login-item-img']} />
            <span className={styles['other-login-item-desc']}>Github</span>
          </div>
        </Col> */}
      </div>
    </div>
  );
};

export default OtherLogin;
