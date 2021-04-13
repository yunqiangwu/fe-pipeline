

class MyLocalStorage {

  storageMap = new Map<string, string>();

  removeItem(key: string) {
    return this.storageMap.delete(key);
  }

  getItem(key: string) {
    return this.storageMap.get(key);
  }

  setItem(key: string, value: string) {
    if(value === null) {
      return this.removeItem(key);
    }
    return this.storageMap.set(key, value);
  }

  clear() {
    this.storageMap = new Map<string, string>();
  }

}


let myLocalStorage = null as any as (typeof window.localStorage);

try{
  myLocalStorage = window.localStorage;
}catch(e) {
  // console.error(e);

  window.top.postMessage({
    type: 'error',
    errorCode: '601',
    content: e,
    message: '当前可能处于无痕模式, 非同源下的 iframe 无法使用 cookie 和 localStorage, 可能将导致某些功能, 无法使用,建议点击全屏编辑.'
  }, '*');

  myLocalStorage = (window as any).myLocalStorage || new MyLocalStorage();
  (window as any).myLocalStorage = myLocalStorage;
}

export {
  myLocalStorage as localStorage
};
