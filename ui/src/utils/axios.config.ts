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

  // axios.interceptors.response.use((response) => {
  //   return response;
  // }, (error) => {
  //   throw error;
  // });

  (axios as any)._IS_CONFIGED = true;
}

export default axios;