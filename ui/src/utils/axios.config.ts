import { notification } from 'choerodon-ui/pro';
import axios from 'axios';
import { getToken, getTokenFromUrlParam } from './token';

if(!(axios as any)._IS_CONFIGED) {
  const apiBasePath = process.env.API_BASE_PATH;
  if(apiBasePath) {
    axios.defaults.baseURL = `${apiBasePath}api/`;
  } else {
    if(process.env.NODE_ENV === 'development') {
      axios.defaults.baseURL = 'http://localhost:3000/api/';
    } else {
      axios.defaults.baseURL = '/api/';
    }
  }
  axios.interceptors.request.use((config) => {
    if((config as any).fetchTokenFromUrlParam){
      return (async () => {
        let _token = await getTokenFromUrlParam();
        if(!_token) {
          _token = getToken();
        }
        if(_token) {
          const newConfig = {
            ...config,
            headers: {
              'Authorization': `Bearer ${_token}`,
              ...config.headers,
            }
          };
          return newConfig;
        }
        return config;
      })();
    } else {
      const token = getToken();
      if(token) {
        return {
          ...config,
          headers: {
            'Authorization': `Bearer ${token}`,
            ...config.headers,
          }
        }
      }
    }
    return config
  });

  axios.interceptors.response.use((response) => {
    return response;
  }, (error) => {

    let err = null;
    if(error?.response?.data?.message) {
      err = new Error(error?.response?.data?.message);
      if(error?.response?.data?.autoAuthClientId) {
        (err as any).autoAuthClientId = error?.response?.data?.autoAuthClientId;
      }
    }  else  {
      err = error;
    }

    if(error.config.showError) {
      console.error(error);
      notification.error({
        message: '操作失败',
        description: err.message,
      });
    }

    if(
      // axios.defaults.baseURL && (error.config.url as string).startsWith(axios.defaults.baseURL) &&
      // (!(error.config as any).fetchTokenFromUrlParam)
      // &&
      (!error.config.notRedirectLogin) &&
      ((error as any).response && (error as any).response.status === 401 &&
      !window.location.pathname.includes(`${(window as any).routerBase || '/'}login`))
      ) {
        let gotoUrl = (`${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}login?redirect_uri=${encodeURIComponent(window.location.href)}`);
        if(error?.response?.data?.autoAuthClientId) {
          (window as any).autoAuthClientId = error?.response?.data?.autoAuthClientId;
          const clientId = (window as any).autoAuthClientId || 'GitLab';
          gotoUrl = `${gotoUrl}&autoAuthClientId=${clientId}`;
        } else if((window as any).autoAuthClientId) {
          gotoUrl = `${gotoUrl}&autoAuthClientId=${(window as any).autoAuthClientId}`;
        }
        console.log(gotoUrl);
        window.location.href = gotoUrl;
    }

    return Promise.reject( err );
  });

  (axios as any)._IS_CONFIGED = true;
}

export default axios;
