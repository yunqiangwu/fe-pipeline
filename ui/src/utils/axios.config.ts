import { notification } from 'choerodon-ui/pro';
import axios from 'axios';
import { getToken } from './token';

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
    return config
  });

  axios.interceptors.response.use((response) => {
    return response;
  }, (error) => {

    let err = null;
    if(error?.response?.data?.message) {
      err = new Error(error?.response?.data?.message);
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

    throw err;
  });

  (axios as any)._IS_CONFIGED = true;
}

export default axios;