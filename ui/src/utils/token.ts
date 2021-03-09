import * as querystring from 'querystring';
import axios from 'axios';

export const TOKEN_KEY = '_token';

export function setToken(token: string | null | undefined) {
    if(token) {
        (window as any)[TOKEN_KEY] = token;
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        delete (window as any)[TOKEN_KEY];
        localStorage.removeItem(TOKEN_KEY);
    }
}

export function getToken() {
    if( (window as any)[TOKEN_KEY]){
        return (window as any)[TOKEN_KEY];
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if(token) {
      return token;
    }
    const urlHasToken = window.location.href.includes('access_token=');
    if(urlHasToken) {
      const match = /access_token=([^&?=]+(&|$))/.exec(window.location.href);
      if(match) {
        const urlToken = match[1];
        setToken(urlToken);
        return urlToken;
      }
    }
}

export async function getTokenFromUrlParam() {
  const hasTokenFromUrlParams = window.location.href.includes('clientToken=');
  if(hasTokenFromUrlParams) {
    if((window as any)._getTokenFromUrlParamPromise) {
      await (window as any)._getTokenFromUrlParamPromise;
      if((window as any)[TOKEN_KEY]){
        return (window as any)[TOKEN_KEY];
      };
    }
    const urlParams = new URLSearchParams(window.location.search.substring(1)+'&'+window.location.hash.substring(1));
    const clientId = urlParams.get('clientId') || 'open-hand';
    const clientToken = urlParams.get('clientToken');
    if(clientToken && clientToken) {
      try{
        const resp = await (((window as any)._getTokenFromUrlParamPromise = axios.post('/auth/login-with-auth-client-token', {
          clientToken, clientId,
        })));
        if(resp.data?.access_token) {
          const _token = resp.data.access_token;
          setToken(_token);
          return _token;
        }
      }catch(e) {
        console.error(e);
      }finally{
        (window as any)._getTokenFromUrlParamPromise = null;
      }
    }
  }
  return null;
}
