import EventEmitter = require('events');
import * as vscode from 'vscode';
import * as socketIO from 'socket.io';


export class WebSocketService extends EventEmitter {

    private wss: socketIO.Server;

    constructor(private listenPort: number = 23010){
        super();
        const io = new socketIO.Server({
            path: '/api',
            cors: {
                // origin: "http://fe-pipeline.localhost:8000",
                methods: ["GET", "POST"],
                exposedHeaders: ['password']
            },
        });
        io.on('connection', async (client) => {

            let pass = 
                (client.request.headers.cookie && client.request.headers.cookie.includes('key=') ) 
                    ? client.request.headers.cookie.replace(
                        /^.*key=([^;]+);.*$/,
                        '$1',
                      ) : 
                     client.request.headers.password;
            if(pass !== process.env.FE_PIPELINE_PASSWORD && process.env.FE_PIPELINE_DEBUG!=='true') {
                console.log('密码错误');
                client.send({
                    type: 'error',
                    content: '密码错误',
                    failed: true,
                });
                setTimeout( () => {
                    client.disconnect();
                }, 2000);
                return;
            }

            client.on('message', (...args) => {
                // console.log('message:', args);
                this.emit('message', {
                    args: args,
                    client,
                });
            });
            // client.send('eventxx', {
            //     aa: 3
            // });
        });
        io.listen(this.listenPort);
        this.wss = io;
    }

    close() {
        if(this.wss) {
          this.wss.close();
        }
    }

}
