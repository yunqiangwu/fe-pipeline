require('./global.less');
import axios from './utils/axios.config';
import { notification } from 'choerodon-ui';

notification.config({
    placement: 'bottomRight',
});


// export async function getInitialState() {
//     const response = await axios.get('/auth/self');
//     if(response.data.username) {
//         return response.data;
//     } else {
//         throw response
//     }
// }
