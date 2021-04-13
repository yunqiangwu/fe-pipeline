

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
  console.error(e);
  myLocalStorage = (window as any).myLocalStorage || new MyLocalStorage();
  (window as any).myLocalStorage = myLocalStorage;
}

export {
  myLocalStorage as localStorage
};
