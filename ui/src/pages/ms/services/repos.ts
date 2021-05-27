import axios from '@/utils/axios.config';
import { AxiosRequestConfig } from 'axios';
import { memoize } from 'lodash';



export const createSpaces = async ({
  existSpaceId,
}: any = {}) => {

  console.log('create spaces');

}


export const refreshSpacesCache = async (id: any) => {

  console.log('refreshSpacesCache spaces');

  const res = await axios.get(`/space/refresh-space-alias-cache/${id}`);

  return res;

}