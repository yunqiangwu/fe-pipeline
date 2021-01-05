declare module '*.less';

declare global {

    interface Window {
        API_BASE_PATH: string;
    }
}


export * from './interface';
