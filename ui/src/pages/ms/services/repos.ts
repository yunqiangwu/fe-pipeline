import axios from '@/utils/axios.config';
import { AxiosRequestConfig } from 'axios';
import querystring from 'querystring';
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
  body,
}: any) => {
  const res = await axios.get(`/space/change-or-create-version-alias?${querystring.stringify(body)}`);
  return res.data;
}

export const createSpacesVersion = async ({
  filelist,
  onprogress,
  body,
}: any = {}) => {

  const {
    spaceId,
    name,
    versionAliasName,
    isZip,
    // prefixPath,
  } = body;

  const data = new FormData();

  data.append('spaceId', spaceId);
  data.append('name', name);
  data.append('versionAliasName', versionAliasName);
  data.append('isZip', isZip);
  // data.append('versionId', versionId);
  // data.append('prefixPath', prefixPath);

  if(!Array.isArray(filelist)) {
    filelist = [filelist];
  }

  const filesPath: string[] = [];

  for (let fIndex = 0; fIndex < filelist.length; fIndex++) {
    const file = filelist[fIndex];
    onprogress({
      value: ((fIndex / filelist.length) * 100).toFixed(2),
      file: file,
    });
    // await new Promise((re) => {
    //   setTimeout(re, 2000)
    // });
    data.append('files', file);
    filesPath.push((file.webkitRelativePath && file.webkitRelativePath.replace(/[^\/]*\//, '')) || file.name);
  }
  data.append('filesPath', JSON.stringify(filesPath));

  const res = await axios.post(`/space/create-space-version`, data, {
    onUploadProgress: progressEvent => {
      let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
      onprogress({
        value: (complete).toFixed(2),
        // file: filelist[0],
      });
    }
  });

  // throw new Error('test');

  return res.data;

}


export const uploadZipToVersion = async ({
  filelist,
  onprogress,
  body,
}: any = {}) => {

  const {
    spaceId,
    versionId,
    prefixPath,
    isResetFiles,
  } = body;

  const data = new FormData();
  data.append('spaceId', spaceId);
  data.append('versionId', versionId);
  data.append('prefixPath', prefixPath);
  data.append('isResetFiles', isResetFiles);

  if(!Array.isArray(filelist)) {
    filelist = [filelist];
  }

  data.append('files', filelist[0]);

  // const filesPath: string[] = [];

  // for (let fIndex = 0; fIndex < filelist.length; fIndex++) {
  //   const file = filelist[fIndex];
  //   // onprogress({
  //   //   value: ((fIndex / filelist.length) * 100).toFixed(2),
  //   //   file: file,
  //   // });
  //   // await new Promise((re) => {
  //   //   setTimeout(re, 2000)
  //   // });
  //   filesPath.push((file.webkitRelativePath && file.webkitRelativePath.replace(/[^\/]*\//, '')) || file.name);
  // }
  // data.append('filesPath', JSON.stringify(filesPath));

  const res = await axios.post(`/space/upload-zip-to-version`, data, {
    onUploadProgress: progressEvent => {
      let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
      onprogress({
        value: (complete).toFixed(2),
        // file: filelist[0],
      });
    }
  });

  // throw new Error('test');

  return res.data;

}


export const deleteSpaces = async ({
  id,
}: any = {}) => {
  const res = await axios.delete(`/space/delete-space/${id}`);
  return res.data;
}

export const refreshSpacesCache = async (id: any, aliasName: string) => {

  console.log('refreshSpacesCache spaces');

  const res = await axios.get(`/space/refresh-space-alias-cache/${id}?aliasName=${aliasName || ''}`);

  return res;

}
