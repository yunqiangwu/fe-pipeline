import { INestApplication } from '@nestjs/common';
import { Request } from 'express';
import { existsSync } from 'fs-extra';

const httpProxy = require('http-proxy');

let _isK8s = null;
const isK8s = () => {
    if(_isK8s === null) {
        const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
        _isK8s = existsSync(filePath);
    }
    return _isK8s;
}


export const ProxyHandler = (app: INestApplication) => {

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

    app.getHttpServer().on('upgrade', function (req, socket, head) {
        
        const hostname = req.headers.host;
        const match = wsReg.exec(hostname);

        if(match) {
            let [ _, port, ip  ] = match;
            if(!isK8s()) {
                ip = '127.0.0.1';
                port = '3001';
            } else {
                ip = ip.replace(ipReg, '$1.$2.$3.$4')
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
    });

    return (req: Request, res, next) => {   

        if(req.headers['ws-proxyed']) {
            return  next();
        } 

        try{
            const hostname = req.hostname;
            const match = wsReg.exec(hostname);
            if(match) {
                let [ _, port, ip  ] = match;
                if(!isK8s()) {
                    ip = '127.0.0.1';
                    port = '3001';
                } else {
                    ip = ip.replace(ipReg, '$1.$2.$3.$4')
                }
    
                const targetUrl = `http://${ip}:${port}`;

                proxy.web(req, res, { target: targetUrl });

                if(proxyError) {
                    const _error =  proxyError;
                    proxyError = null;
                    throw _error;
                }
                return;
            }

        } catch(e) {
            console.log(e);
            throw e;
        }
        return next();
    }

}