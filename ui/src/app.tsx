require('./global.less');
import axios from './utils/axios.config';
import { notification, configure } from 'choerodon-ui';

notification.config({
    placement: 'bottomRight',
    // @ts-ignore
    dataKey: '_rows',
});

const c7nAxios = axios.create({
  baseURL: axios.defaults.baseURL,

});

c7nAxios.interceptors.response.use((response) => {
  return response.data;
});

configure({
  axios: c7nAxios,
  tableColumnAlign: () => {
    return 'left' as any;
  },
})


// export async function getInitialState() {
//     const response = await axios.get('/auth/self');
//     if(response.data.username) {
//         return response.data;
//     } else {
//         throw response
//     }
// }
