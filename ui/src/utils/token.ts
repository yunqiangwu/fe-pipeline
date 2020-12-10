

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
    return localStorage.getItem(TOKEN_KEY);
}
