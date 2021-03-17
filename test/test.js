const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function processLineByLine(f) {

    const ports = [];
    const portReg = /^\s*\w+:\s*\w+:(\w+)\s+\w+:\w+\s+0A/;

    const fileStream = fs.createReadStream(f);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    // 注意：我们使用 crlfDelay 选项将 input.txt 中的所有 CR LF 实例（'\r\n'）识别为单个换行符。
    // input.txt 中的每一行在这里将会被连续地用作 `line`。
    for await (const line of rl) {
      if(line) {
        const res = portReg.exec(line);
        if(res){
            ports.push(parseInt(res[1],16));
        //   console.log(`Line from file: ${line}`);
        }
      }
    }

    fileStream.close();

    return ports;
  }
  
  const fnNetTCP  = path.join(__dirname, 'tcp.data');

processLineByLine(fnNetTCP).then(ports => {
    console.log(`ports: ${ports.join(',')}`);
});

