import axios from '@/utils/axios.config';
import { AxiosRequestConfig } from 'axios';
import { divide, memoize } from 'lodash';
import React from 'react';



export const createSpaces = async ({
  existSpaceId,
  body,
}: any = {}) => {

  const res = await axios.post(`/space/create-space`, body);

  return res.data;

}

export const createSpacesVersionAlias = async ({
  existSpaceId,
  body,
}: any = {}) => {

  // const res = await axios.post(`/space/create-space`, body);

  // return res.data;

}

export const createSpacesVersion= async ({
  filelist,
  onprogress,
  body,
}: any = {}) => {

  // const {spaceId} = body;
  // const res = await axios.post(`/space/create-space`, body);

  // return res.data;

  await new Promise((re) => {
    setTimeout(re, 2000)
  });

  console.log(filelist);

  for(let fIndex = 0; fIndex < filelist.length; fIndex++) {
    onprogress({
      value: (fIndex / filelist.length ) * 100,
      file: filelist[fIndex],
    });
    await new Promise((re) => {
      setTimeout(re, 2000)
    });
  }

}

export const deleteSpaces = async ({
  id,
}: any = {}) => {
  const res = await axios.delete(`/space/delete-space/${id}`);
  return res.data;
}

export const refreshSpacesCache = async (id: any) => {

  console.log('refreshSpacesCache spaces');

  const res = await axios.get(`/space/refresh-space-alias-cache/${id}`);

  return res;

}