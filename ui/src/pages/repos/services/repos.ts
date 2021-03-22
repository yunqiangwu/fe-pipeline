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


type fetchGitLabReposParams = {
  per_page?: string;
  page?: string;
  search?: string;
};

export const fetchGitLabRepos = async (queryData?: fetchGitLabReposParams): Promise<entity.GitLabRepos[]> => {
  return [
    {
      "id": 9502,
      "description": null,
      "name": "hzero-blocks",
      "name_with_namespace": "中台研发中心-前端基础研发 / hzero-blocks",
      "path": "hzero-blocks",
      "path_with_namespace": "hzero-hzero-c7n-hips/hzero-blocks",
      "created_at": "2020-04-08T09:24:07.329+08:00",
      "default_branch": "master",
      "tag_list": [],
      "ssh_url_to_repo": "git@code.choerodon.com.cn:hzero-hzero-c7n-hips/hzero-blocks.git",
      "http_url_to_repo": "https://code.choerodon.com.cn/hzero-hzero-c7n-hips/hzero-blocks.git",
      "web_url": "https://code.choerodon.com.cn/hzero-hzero-c7n-hips/hzero-blocks",
      "readme_url": "https://code.choerodon.com.cn/hzero-hzero-c7n-hips/hzero-blocks/blob/master/README.md",
      "avatar_url": null,
      "star_count": 0,
      "forks_count": 0,
      "last_activity_at": "2021-03-19T13:47:04.702+08:00",
      "namespace": {
          "id": 24267,
          "name": "中台研发中心-前端基础研发",
          "path": "hzero-hzero-c7n-hips",
          "kind": "group",
          "full_path": "hzero-hzero-c7n-hips",
          "parent_id": null
      }
    },
  ];

  const apiInfo = await fetchGitLabAPIInfo();
  const config: AxiosRequestConfig = {
    method: 'GET',
    url: `${apiInfo.protocol}://${apiInfo.host}/api/v4/projects`,
    params: {
      order_by: 'last_activity_at',
      //search:hzero
      owned:true,
      per_page: 10,
      membership:true,
      //starred:true
      simple: true,
      ...queryData,
    },
    headers: {
      'Authorization': `Bearer ${apiInfo.accessToken}`,
    }
  };
  const res = await axios(config);
  return res.data;
}
