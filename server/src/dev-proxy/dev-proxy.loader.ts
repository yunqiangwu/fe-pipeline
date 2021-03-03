

import { Injectable } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { Request } from 'express';
import { Config } from '../config/config';

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
export class DevProxyLoader extends AbstractLoader {

  public register(
    httpAdapter: AbstractHttpAdapter,
  ) {
    const httpApp = httpAdapter.getHttpServer();
    const expressApp = httpAdapter.getInstance();
    expressApp.use(this.proxyHandler(httpApp));
    console.log('DevProxyLoader loaded.');
  }

  proxy: any;

  constructor() {
    super();

    this.proxy = httpProxy.createProxyServer({
      timeout: 6000,
      target: `http://127.0.0.1:8000`,
      // proxyReqOptDecorator: function(proxyReqOpts) {
      //     proxyReqOpts.headers['ws-proxyed'] = 'true';
      //     return proxyReqOpts;
      // },
      ws: true,
    });

    this.proxy.on('error', (err) => {
      console.error(err);
    });

  }

  proxyHandler(app: any): any {

    app.on('upgrade',  (req, socket, head) => {
      if(req._handled) {
        return;
      }

      const hostname = req.headers.host;
      const path = req.url;
      const configHostname = Config.singleInstance().get('hostname');


      if (hostname.includes(configHostname) && (path.startsWith('/fed') || path.startsWith('/dev-server'))) {
        const ip = '127.0.0.1';
        const port = '8000';
        this.proxy.ws(req, socket, head, {
          target: {
            host: ip,
            port,
          }
        });
        req._handled = true;
      } else {
        // this.proxy.ws(req, socket, head, {
        //   target: {
        //     host: '127.0.0.1',
        //     port: 88,
        //   }
        // });
      }
    });

    return (req: Request, res, next) => {
      try {
        const hostname = req.hostname;
        const path = req.path;
        const configHostname = Config.singleInstance().get('hostname');

        if (hostname.startsWith(configHostname) && (path.startsWith('/fed') || path.startsWith('/dev-server'))) {
          this.proxy.web(req, res);
          return;
        }
      } catch (e) {
        console.error(e);
      }
      return next();
    };
     // throw new Error('Method not implemented.');
  }
  ;
}