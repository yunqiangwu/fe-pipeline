// @ts-nocheck

import React, { useRef, useEffect } from "react";
import { notification, Spin } from 'choerodon-ui';
import { useModel } from "umi";

export const InitStateProvider: React.FC = (props) => {
  const { children } = props;
  const appLoaded = useRef(false);
  const { initialState, loading } = useModel("initialState");

  // useEffect(() => {
  //   if(!initialState) {
  //     return;
  //   }
  //   if(initialState.username) {
  //     notification.success({
  //       message: '登录成功',
  //       description: `欢迎 ${initialState.username || ''}!`,
  //     });
  //   }
  // }, [initialState]);

  useEffect(() => {
    if (!loading) {
      appLoaded.current = true;
    }
  }, [loading]);
  // initial state loading 时，阻塞渲染

  if(loading && !appLoaded.current && !initialState) {
    return <Spin />
  }
  return children;
};
