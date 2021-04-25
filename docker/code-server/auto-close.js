// 8分钟内无任何操作自动关闭容器

const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');

const getTcpFilePorts = async () => {

    const fnNetTCP = "/proc/net/tcp";

    const ports = [];
    const pendingPorts = [];
    const listenPortReg = /^\s*\w+:\s*\w+:(\w+)\s+\w+:\w+\s+0A\s+/;
    const pendingPortReg = /^\s*\w+:\s*\w+:(\w+)\s+\w+:\w+\s+01\s+/;

    const fileStream = fs.createReadStream(fnNetTCP);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // 注意：我们使用 crlfDelay 选项将 input.txt 中的所有 CR LF 实例（'\r\n'）识别为单个换行符。
    // input.txt 中的每一行在这里将会被连续地用作 `line`。
    for await (const line of rl) {
        if (line) {
            const res = listenPortReg.exec(line);
            if (res) {
                ports.push(parseInt(res[1], 16));
                //   console.log(`Line from file: ${line}`);
            }
            const res2 = pendingPortReg.exec(line);
            if (res2) {
                pendingPorts.push(parseInt(res2[1], 16));
                //   console.log(`Line from file: ${line}`);
            }

        }
    }
    fileStream.close();
    return {
        listenPorts: ports,
        pendingPorts,
    };
}


// 自动休眠工作空间
const stopWs = async () => {

    const FE_PIPELINE_TOKEN = process.env.FE_PIPELINE_TOKEN;
    const FE_PIPELINE_WS_ID = process.env.FE_PIPELINE_WS_ID;
    const FE_PIPELINE_MANAGER_SERVICE_HOST = process.env.FE_PIPELINE_MANAGER_SERVICE_HOST;
    const FE_PIPELINE_MANAGER_SERVICE_PORT = process.env.FE_PIPELINE_MANAGER_SERVICE_PORT;

    if (!FE_PIPELINE_TOKEN || !FE_PIPELINE_WS_ID || !FE_PIPELINE_MANAGER_SERVICE_PORT) {
        return;
    }

    // const FE_PIPELINE_MANAGE_API_HOST = `http://10.211.144.125:3000`;
    const FE_PIPELINE_MANAGE_API_HOST = `http://${FE_PIPELINE_MANAGER_SERVICE_HOST}:${FE_PIPELINE_MANAGER_SERVICE_PORT}`;
    // 10.211.144.125

    const manageApiUrl = FE_PIPELINE_MANAGE_API_HOST;

    const _cmd = `curl -X 'POST' \
  '${manageApiUrl}/api/workspace/close-ws/${FE_PIPELINE_WS_ID}' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer ${FE_PIPELINE_TOKEN}' \
  -d ''`;
    let _stdout = '';
    let _stderr = '';

    try {
        const res = await new Promise((resolve, reject) => {

            console.log(_cmd);

            const p = exec(_cmd, {
                shell: 'bash'
            }, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    stdout,
                    stderr,
                });
            });
            p.stdout && p.stdout.on('data', (chunk) => {
                _stdout += chunk.toString();
            });
            p.stderr && p.stderr.on('data', (chunk) => {
                _stderr += chunk.toString();
            });
        });
        return {
            ...res,
            content: res.stdout,
        };
    } catch (e) {
        // console.error(e);
        throw ({
            // ...e,
            message: _stderr || e.message,
            _stdout,
            _stderr,
        });
    }
};




(async () => {

    const fnNetTCP = "/proc/net/tcp";

    if (!fs.existsSync(fnNetTCP)) {
        return [];
    }

    let lastCheckTime = Date.now();

    while (true) {

        const currentPorts = await getTcpFilePorts();

        // todo 检查 8分钟 没动 自动休眠容器

        let nowTime = Date.now();

        const eight = 1000 * 60 * 8;
        // const eight = 1000 * 10;

        if (nowTime - lastCheckTime >= eight) {

            if (!currentPorts.pendingPorts.includes(23000)) {
                console.log('8 分钟到了!, 当前没有操作的话, 开始休眠空间');
                try {
                    const res = await stopWs();
                    console.log(`执行结果: ${res.stdout}`);
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(null);
                        }, 30000000);
                    });
                } catch (e) {
                    console.error(e);
                }
            } else {
                console.log('8 分钟到了!, 当前有操作的话, 继续运行空间, 不自动休眠');
            }

            lastCheckTime = nowTime;
        }

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, 3000);
        });

    }
})();