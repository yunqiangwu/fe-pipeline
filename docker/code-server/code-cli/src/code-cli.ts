#!/usr/bin/env node

import io, { Socket } from 'socket.io-client';
import * as yargsParser from 'yargs-parser';

const openFile = async ({ content }: { content: string }) => {

    return new Promise((resolve, reject) => {

        let socket: Socket | null = null;
        let wssUrl;

        wssUrl = 'ws://127.0.0.1:23010';

        if (!socket) {
            socket = io(wssUrl, { path: '/api', extraHeaders: { password: process.env.FE_PIPELINE_PASSWORD || '' } });
            // socket.connect();
        }

        const closeWss = () => {
            if (!socket) {
                return;
            }
            socket.disconnect();
            socket.close();
            socket = null;
            // closeWss = null;
        };

        const _randNum = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2, 8))).padEnd(32, '0').substr(0, 32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1-$2-$3-$4-$5');

        let timeId: any = setTimeout(() => {
            if (socket) {
                closeWss();
                reject({
                    oldContent: content,
                    _isReturnFromVscode: true,
                    type: 'open',
                    failed: true,
                    content: 'timeout',
                });
            }
        }, 3000);

        socket.on("message", (data: any) => {
            if (data._randNum !== _randNum) {
                return;
            }
            if(!socket) {
                return;
            }
            clearTimeout(timeId);
            timeId = null;

            if(data.status === 'failed') {
                reject({
                    oldContent: content,
                    ...data,
                    _isReturnFromVscode: true,
                });
            } else {
                resolve({
                    oldContent: content,
                    ...data,
                    _isReturnFromVscode: true,
                });
            }

            closeWss();
        });

        socket.send({
            type: 'open',
            content,
            cwd: process.cwd(),
            _randNum,
        });
    });

};

(async () => {
    try{
        const args = yargsParser(process.argv.slice(2));
        // console.log(args);

        let theOpenFile = args._[0];
        if(theOpenFile === 'open') {
            theOpenFile = args._[1];
        }

        if(theOpenFile) {
            const res = await openFile({ content: theOpenFile as string });
            console.log(res);
        }

    }catch(e) {
        console.error(e);
        process.exit(1);
    }
})();

