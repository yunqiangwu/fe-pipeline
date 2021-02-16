import * as React from 'react';
import axios from 'axios';
import { useAsyncFn } from 'react-use';
import { DEFAULT_GITHUB_CLIENT_ID } from './constants';
import { Row, Col } from 'choerodon-ui';

const OtherLogin = (props: any) => {
    const [_, otherLoginHandle] = useAsyncFn(async (e: string) => {
        const type = e;
        const current_redirect_uri = new URLSearchParams(props.location.search).get('redirect_uri');
        let current_url = `${location.protocol}//${location.host}${location.pathname}`;
        if(current_redirect_uri) {
          current_url = `${current_url}?redirect_uri=${current_redirect_uri}`;
        }
        current_url = `${current_url}${current_url.includes('?') ? '&' : '?'}`
        let redirect_uri;
        switch (type) {
          case 'choerodon':
            redirect_uri = encodeURIComponent(`${current_url}login-type=${type}`);
            location.href = `https://api.choerodon.com.cn/oauth/oauth/authorize?redirect_uri=${redirect_uri}&response_type=token&client_id=localhost`;
            break;
          case 'open-hand':
            redirect_uri = encodeURIComponent(`${current_url}login-type=${type}`);
            location.href = `https://gateway.open.hand-china.com/oauth/oauth/authorize?redirect_uri=${redirect_uri}&response_type=token&client_id=hsop-app`;
            break;
          case 'github':
            let client_id = DEFAULT_GITHUB_CLIENT_ID;
            try{
              const githubConfigResponse = await axios.get('/auth/oauth-config');
              client_id = githubConfigResponse.data.github.client_id;
            }catch(e){
              console.error(e);
            }
            redirect_uri = encodeURIComponent(`${current_url}login-type=${type}`);
            location.href = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${client_id}&redirect_uri=${redirect_uri}`;
            break;
          default:
            break;
        }
      }, []);

    return (
        <div className="other-login">
              <Row className="other-login-line">
                <Col>
                  <span>其他登录</span>
                </Col>
              </Row>
              <Row type="flex" justify="space-around" align="middle" className="other-login-content">
                <Col span={8}>
                  <div onClick={() => otherLoginHandle('choerodon')} className="other-login-item">
                    <img src={require('./assets/choerodon_logo.svg')} alt="choerodon" className="other-login-item-img" />
                    <span className="other-login-item-desc">Choerodon</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div onClick={() => otherLoginHandle('open-hand')} className="other-login-item">
                    <img src={require('./assets/open-hand-logo2.png')} alt="open-hand" className="other-login-item-img" />
                    <span className="other-login-item-desc">汉得开发平台</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div onClick={() => otherLoginHandle('github')} className="other-login-item">
                    <img src={require('./assets/gitlab-logo.svg')} alt="github" className="other-login-item-img" />
                    <span className="other-login-item-desc">Github</span>
                  </div>
                </Col>
              </Row>
            </div>
    );
};

export default OtherLogin;