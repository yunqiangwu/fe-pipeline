

import { HttpServer, Injectable } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { Request } from 'express';

const httpProxy = require('http-proxy');

@Injectable()
export abstract class AbstractLoader {
    public abstract register(
        httpAdapter: AbstractHttpAdapter,
    );

    public getIndexFilePath(clientPath: string): string {
        return '';
    }
}

@Injectable()
export class WsProxyLoader extends AbstractLoader {

    constructor() {
        super();
    }

    ProxyHandler = (app: HttpServer) => {

        const wsReg = /^(\d+)-?([^\/]+)\.ws\.(.+)(\/|$)/;
        const ipReg = /^(\d+)-(\d+)-(\d+)-(\d+)$/;

        const proxy = httpProxy.createProxyServer({
            timeout: 6000,
            // proxyReqOptDecorator: function(proxyReqOpts) {
            //     proxyReqOpts.headers['ws-proxyed'] = 'true';
            //     return proxyReqOpts;
            // },
            ws: true,
        });

        let proxyError;

        proxy.on('error', (err) => {
            proxyError = err;
        });

        (app as any).on('upgrade', (req, socket, head) => {
            if (req._handled) {
                return;
            }

            const hostname = req.headers.host;
            const match = wsReg.exec(hostname);

            if (match) {
                let [_, port, ip] = match;
                ip = ip.replace(ipReg, '$1.$2.$3.$4');

                // # proxy-backend-host: 127.0.0.1
                // # proxy-backend-port: 80

                if (process.env.PROXY_BACKEND_HOST) {
                    ip = process.env.PROXY_BACKEND_HOST;
                }
                if (process.env.PROXY_BACKEND_PORT) {
                    port = process.env.PROXY_BACKEND_PORT;
                }

                proxy.ws(req, socket, head, {
                    target: {
                        host: ip,
                        port,
                    }
                });
            } else {

                proxy.ws(req, socket, head, {
                    target: {
                        host: '127.0.0.1',
                        port: 88,
                    }
                });
            }
            req._handled = true;
        });

        return (req: Request, res, next) => {

            if (req.headers['ws-proxyed']) {
                return next();
            }

            try {
                const hostname = req.hostname;
                const match = wsReg.exec(hostname);
                if (match) {
                    let [_, port, ip] = match;
                    ip = ip.replace(ipReg, '$1.$2.$3.$4');

                    // # proxy-backend-host: 127.0.0.1
                    // # proxy-backend-port: 80

                    if (process.env.PROXY_BACKEND_HOST) {
                        ip = process.env.PROXY_BACKEND_HOST;
                    }
                    if (process.env.PROXY_BACKEND_PORT) {
                        port = process.env.PROXY_BACKEND_PORT;
                    }

                    const targetUrl = `http://${ip}:${port}`;

                    proxy.web(req, res, { target: targetUrl });

                    if (proxyError) {
                        const _error = proxyError;
                        proxyError = null;
                        throw _error;
                    }
                    return;
                }

            } catch (e) {
                console.log(e);
                throw e;
            }
            return next();
        }

    }

    public register(
        httpAdapter: AbstractHttpAdapter,
    ) {
        const httpApp = httpAdapter.getHttpServer();
        const expressApp = httpAdapter.getInstance();
        expressApp.use(this.ProxyHandler(httpApp));
        console.log('WsProxyLoader loaded.');
    };
}