import { Request } from 'express';
import * as proxy from 'express-http-proxy';
import { existsSync } from 'fs-extra';

let _isK8s = null;
const isK8s = () => {
    if(_isK8s === null) {
        const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
        _isK8s = existsSync(filePath);
    }
    return _isK8s;
}

const wsReg = /^(\d+)-?([^\/]+)\.ws\.(.+)(\/|$)/;

export const ProxyHandler = () => {

    return (req: Request, res, next) => {   
        if(req.headers['ws-proxyed']) {
            return  next();
        }  
        const hostname = req.hostname;
        const match = wsReg.exec(hostname);
        if(match) {
            let [ _, port, ip  ] = match;
            if(!isK8s()) {
                ip = '127.0.0.1'
            }
            return proxy(`${ip}:${port}`, {
                timeout: 6000,
                proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
                proxyReqOpts.headers['ws-proxyed'] = 'true';
                return proxyReqOpts;
                }
            })(req, res, next);
        }
        return next();
    }

}