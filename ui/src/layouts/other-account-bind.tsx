import * as React from 'react';
import axios from 'axios';
import { useAsync, useAsyncFn } from 'react-use';
import {
  useLocation
} from "react-router-dom";
import styles from './other-account-bind.less';
import { Row, Col, Alert } from 'choerodon-ui';
import { Spin } from 'choerodon-ui/pro/lib';
import { localStorage } from '../utils/local-storage';

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
  authInfo?: {
    username: string;
    avatar: string;
  }
};

export const OtherAccountBind = () => {

  let location = useLocation();

  React.useEffect(() => {
    const current_redirect_uri = new URLSearchParams(location.search).get('redirect_uri');
    if (current_redirect_uri) {
      localStorage.setItem('current_redirect_uri', current_redirect_uri);
      // redirect_uri = `${redirect_uri}/${encodeURIComponent(JSON.stringify({redirect_uri: current_redirect_uri}))}`;
    }
  }, []);

  const [authConfigs, fetch] = useAsyncFn(async () => {
    const response = await axios.get('/auth/oauth-config');
    const authInfoResponse = await axios.get('/auth/other-account-bind');
    const data = response.data.map(
      (configItem: any) => {
        const authInfo = authInfoResponse.data.find((infoItem: any) => {
          return infoItem.authClientId === configItem.id;
        });
        if(authInfo) {
          configItem.authInfo = convertAuthInfo(authInfo);
        }
        return configItem;
      }
    );
    return data;
  });

  // const winRef = React.useRef<Window | null>(null);

  const handleBind = React.useCallback((arg0: { bindUrl: string; }) => {
    // if(winRef.current && (winRef.current as any)._message) {
    //   winRef.current.removeEventListener('message', (winRef.current as any)._message);
    // }
    const { bindUrl } = arg0;
    const win = window.open(bindUrl,'fe-pipeline-authConfigs', 'width=400,height=400');
    // winRef.current = win;
    // (window as any).xxxx = win;
    // if(win && win.addEventListener) {
    //   (win as any)._message = function(event: MessageEvent) {
    //     console.log('message', event);
    //   };
    //   win.addEventListener('message', (win as any)._message);
    // }
  }, []);

  React.useEffect(() => {
    fetch();

    const lis = function(event: MessageEvent) {
      // console.log('message', event);
      if(event.data === 'refresh-authConfigs') {
        fetch();
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
          <span>账号绑定</span>
        </Col>
      </Row>
      <div className={styles['other-login-content']}>
        {
          authConfigs.value && (authConfigs.value as AuthConfig[]).map((authConfig, index) => {

            let authUrl = '/'

            if(authConfig.oauth.authUrl) {
              authUrl = `${authConfig.oauth.authUrl}`;
              let redirect_uri = `${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}auth/${authConfig.host}/callback`;
              authUrl = `${authConfig.oauth.authUrl}${authConfig.oauth.authUrl.includes('?') ? '&' : '?'}redirect_uri=${redirect_uri}`
            }

            return (
              <div className={styles['other-login-col']} key={`k_${index}`}>
                <div onClick={() => handleBind({bindUrl: authUrl})} className={styles['other-login-item']}>
                  {
                    authConfig.authInfo ?
                    <img src={authConfig.authInfo.avatar} alt="choerodon" className={styles['other-login-item-img']} /> :
                    <div className={styles['other-login-item-unbind']} >未绑定</div>
                  }
                  <span className={styles['other-login-item-desc']}>{ authConfig.authInfo ? `${authConfig.authInfo.username} (${authConfig.id})` : authConfig.id}</span>
                </div>
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

function convertAuthInfo(authInfo: any): any {

  const loginType = authInfo.threePlatformType;
  let username = authInfo.username;
  let avatar = authInfo.avatar;
  const accountData = JSON.parse(authInfo.accountData);

  if(loginType === 'open-hand') {
    avatar = accountData.imageUrl || accountData.favicon;
    username = accountData.loginName;
  }
  if(loginType === 'Choerodon') {
    avatar = accountData.imageUrl || accountData.favicon  || accountData.logo;
    username = accountData.loginName;
  }
  if(loginType === 'GitLab') {
    avatar = accountData.avatar_url;
    username = accountData.username;
  }
  if(loginType === 'GitHub') {
    avatar = accountData.avatar_url;
    username = accountData.login;
  }

  avatar = avatar || require('../assets/logo.png');

  return {
    username,
    avatar,
  };
}
