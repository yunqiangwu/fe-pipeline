import axios from '@/utils/axios.config';
import { AxiosRequestConfig } from 'axios';
import { memoize } from 'lodash';


export type GitLabAPIInfoRes = {
  protocol: string;
  host: string;
  accessToken: string;
};

export const fetchGitLabAPIInfo = memoize(async (authClientId: string = 'GitLab'): Promise<GitLabAPIInfoRes> => {
  const config: AxiosRequestConfig = {
    method: 'GET',
    url: '/auth/other-account-bind-token',
    params: { authClientId },
  };
  const res = await axios(config);
  return res.data;
});
