// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketService } from './websocket-services';
import { exec } from 'child_process';
const readline = require('readline');

type ShowOptions = {
	preserveFocus?: boolean,
	viewColumn: vscode.ViewColumn,
};

type IWsMessage = {
	content: string;
}

const runCommand = async (params: IWsMessage) => {
	let cmd = params.content;
	let _cmd = `. $NVM_DIR/nvm.sh && ${cmd}`;

	let cmdCwd = '/tmp';

	if(vscode?.workspace?.workspaceFolders) {
		cmdCwd = vscode?.workspace?.workspaceFolders[0].uri.path;
	}

	let _stdout = '', _stderr = '';

	try{
		const res: any = await new Promise((resolve, reject) => {
			const p = exec(_cmd, { cwd: cmdCwd, env: process.env, shell: 'bash' }, (err, stdout, stderr) => {
				if(err) {
					reject(err);
					return;
				}
				// _stdout = stdout;
				// _stderr = stderr;
				resolve({
					stdout, stderr,
				});
			});
			p.stdout?.on('data', (chunk) => {
				_stdout  += chunk.toString();
			});
			p.stderr?.on('data', (chunk) => {
				_stderr  += chunk.toString();
			});
			// p.stdout?.on('end', (chunk) => {
			// 	_stdout  += chunk.toString();
			// });
		});
		return {
			...res,
			content: res.stdout,
		};
	}catch(e) {
		// console.error(e);
		throw ({
			// ...e,
			message: _stderr || e.message,
			_stdout, _stderr,
		});

	}
}

const openFile = async (params: IWsMessage ) => {

	let filePath = params.content;

	console.log(`打开文件: ${filePath}`);

	let workSpaceCwd = '/tmp';

	if(!fs.existsSync(filePath)) {

		filePath = path.join(process.cwd(), params.content);

		if(!fs.existsSync(filePath)) {

			if(vscode?.workspace?.workspaceFolders) {
				workSpaceCwd = vscode?.workspace?.workspaceFolders[0].uri.path;
			}
		
			filePath = path.join(workSpaceCwd, params.content);

			if(!fs.existsSync(filePath)) {
				throw new Error(`${workSpaceCwd} 中不存在 ${params.content}`);
			}
			
		}
	}

	const doc = await vscode.workspace.openTextDocument(filePath);
	const res = await vscode.window.showTextDocument(doc);
	
	// const res: any = await vscode.commands.executeCommand('vscode.open', filePath);

	return {
		// ...res,
		content: `文件 ${filePath} 打开成功`,
	};
};

const getTcpFilePorts = async () => {

	const fnNetTCP = "/proc/net/tcp";

	const ports: number[] = [];
	const pendingPorts: number[] = [];
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

const handleGitpodPorts = async ({
	currentOpen, scriptUri, GITPOD_PORTS
}:{
	currentOpen: number[], scriptUri: vscode.Uri, GITPOD_PORTS: string
}) => {
	const _handled: number[] = [];
	try {
		const gitpodPorts = JSON.parse(GITPOD_PORTS) as any[];
		for (const portIndex in gitpodPorts) {
			if(_handled.includes(portIndex as any) ) {
				continue;
			}
			const portObj = gitpodPorts[portIndex];
			if(!currentOpen.includes(+portObj.port)) {
				continue;
			}
			if (portObj.onOpen !== 'ignore') {
				_handled.push(portIndex as any);
				const openUrl = vscode.Uri.parse(`${scriptUri.scheme}://${scriptUri.authority.replace(/^\d+-(.*)/, `${portObj.port}-$1`)}`);
				if (portObj.type === 'browser') {
					vscode.env.openExternal(openUrl);
				} else {
					vscode.commands.executeCommand('simpleBrowser.api.open', openUrl, {
						preserveFocus: true,
						viewColumn: vscode.ViewColumn.Beside,
					} as ShowOptions);
				}
				break;
			}
		}
	} catch (e) {
		console.error(e);
	}
	return _handled;
}


let isBreak = false;

let wss: WebSocketService|null;

const WS_DIR_FILE = path.join(`/workspace/.gitpod`, 'config.json') // '/workspace/.gitpod/config.json';

const setWsData = (key: string, value: string | null) => {
	let data = {} as any;
	if (!fs.existsSync(WS_DIR_FILE)) {
		if (!fs.existsSync(path.dirname(WS_DIR_FILE))) {
			fs.mkdirSync(path.dirname(WS_DIR_FILE), { recursive: true });
		}
	} else {
		data = require(WS_DIR_FILE);
	}
	if (value === null || value === undefined) {
		delete data[key];
	} else {
		data[key] = value;
	}
	fs.writeFileSync(WS_DIR_FILE, JSON.stringify(data))
};

const getWsData = (key: string) => {
	if (fs.existsSync(WS_DIR_FILE)) {
		let data = require(WS_DIR_FILE);
		return data[key];
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fe-pipeline-extensions" is now active!');

	// // 创建 webview
	let panel = vscode.window.createWebviewPanel(
		'catWebview',
		'Cat Webview',
		{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			enableCommandUris: true,
		}
	);

	const scriptUri = panel.webview.asWebviewUri(
		vscode.Uri.file(path.join(context.extensionPath, 'res', 'main.js'))
	);

	// panel.onDidDispose(() => {
	// 	panel = null;
	// });

	setTimeout(() => {
		panel.dispose();
	}, 0);

	// 监听并执行命令
	(() => {
		setTimeout(() => {
			const wssPort = 23010;
			wss = new WebSocketService(wssPort);

			wss.on('message', async ({
				args,
				client, // socketIO.Socket<DefaultEventsMap, DefaultEventsMap>
			}) => {

				if(!args || !args[0]) {
					return
				}
				const params = args[0];
				
				try{
					const {type} = params;

					let res;

					if(type === 'command') {
						res = await runCommand(params);
					}

					if(type === 'open') {
						res = await openFile(params);
					}

					client.send({
						status: 'success',
						...params,
						...res,
					});

				}catch(er) {
					client.send({
						status: 'failed',
						...params,
						...er,
						content: er.message,
					});
				}

			});

			console.log('命令监听开启');
		}, 0);
	})();


	const GITPOD_TASKS = process.env.GITPOD_TASKS;

	if (GITPOD_TASKS) {
		try {

			const gitpodTask = JSON.parse(GITPOD_TASKS);

			for (const taskIndex in gitpodTask) {
				const taskObj = gitpodTask[taskIndex];
				const taskName = `task_${taskIndex}`;
				const storeKey = `cmd_${taskIndex}`;
				let ter = vscode.window.terminals.find(item => item.name === taskName);
				if (ter) {
					continue;
				}
				const runCommand = (isRunInit?: boolean) => {
					const ter = vscode.window.createTerminal(taskName);
					let cmd = 'ls';
					if (taskObj.init && taskObj.command && isRunInit) {
						cmd = ` (${taskObj.init}) && ( ${taskObj.command})`;
					} else if (taskObj.command) {
						cmd = taskObj.command;
					}
					ter.sendText(cmd, true);
					ter.show();
					return ter;
				};
				if(!taskObj.noCache) {
					const isCompleteTask = getWsData(storeKey);
					if (isCompleteTask) {
						ter = runCommand();
						continue;
					}
					setWsData(storeKey, 'true',);
				}
				ter = runCommand(true);
				if(!taskObj.noCache) {
					const lis = (t: vscode.Terminal) => {
						setWsData(storeKey, null);
					};
					vscode.window.onDidCloseTerminal(lis);
				}
			}

		} catch (e) {
			console.error(e);
		}
	}


	(async () => {

		const fnNetTCP = "/proc/net/tcp";

		if (!fs.existsSync(fnNetTCP)) {
			return [];
		}

		const GITPOD_PORTS = process.env.GITPOD_PORTS;


		while (!isBreak) {

			const currentPorts = await getTcpFilePorts();

			// console.log(`currentPorts: ${currentPorts.join(',')}`);

			if (GITPOD_PORTS) {
				await handleGitpodPorts({
					scriptUri,
					GITPOD_PORTS,
					currentOpen: currentPorts.listenPorts,
				});
			}

			await new Promise((resolve) => {
				setTimeout(() => {
					resolve(null);
				}, 3000);
			});

		}
	})();

	context.subscriptions.push(vscode.window.registerExternalUriOpener(
		'myExtension.opener',
		{
			canOpenExternalUri(uri: vscode.Uri) {

				// Check if a URI can be opened.
				// This is called when the user first selects a link and VS Code
				// needs to determine which openers are available.

				if (uri.authority.includes('localhost') || uri.authority.includes('127.0.0.1') || uri.authority.includes('0.0.0.0')) {
					// This opener has default priority for this URI.
					// This will result in the user being prompted since VS Code always has
					// its own default opener.
					return vscode.ExternalUriOpenerPriority.Preferred
					// return vscode.ExternalUriOpenerPriority.Default;
				}

				// The opener can be used but should not be used by default
				return vscode.ExternalUriOpenerPriority.Option;

			},
			openExternalUri(resolveUri: vscode.Uri) {

				// vscode.open
				console.log(resolveUri.toString());
				let port = resolveUri.authority.replace(/^.*:(\d+)/, '$1') as string;
				if (!port.match(/^\d+$/)) {
					port = '80';
				}

				const newUrl = vscode.Uri.parse(`${scriptUri.scheme}://${scriptUri.authority.replace(/^\d+-(.*)/, `${port}-$1`)}`);

				vscode.env.openExternal(newUrl);

				// vscode.commands.executeCommand('simpleBrowser.api.open', newUrl, {
				// 	preserveFocus: true,
				// 	viewColumn: vscode.ViewColumn.Beside,
				// } as ShowOptions);

				// vscode.commands.executeCommand('vscode.open', resolveUri.toString());

				// Actually open the URI.
				// This is called once the user has selected this opener.
			}
		},
		{
			schemes: ['http', 'https'],
			label: 'Open URL Using fe pipeline'
		}
	));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('fe-pipeline-extensions.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed

		vscode.window.showInformationMessage(`Hello World! ${WS_DIR_FILE}`);

		// await stopWs(scriptUri);

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {

	isBreak = true;

	const GITPOD_TASKS = process.env.GITPOD_TASKS;

	if(GITPOD_TASKS) {
		const gitpodTask = JSON.parse(GITPOD_TASKS);
		for (const taskIndex in gitpodTask) {
			const taskObj = gitpodTask[taskIndex];
			if(!taskObj.noCache) {
				const storeKey = `cmd_${taskIndex}`;
				setWsData(storeKey, null);
			}
		}
	}

	if(wss) {
		wss.close();
		wss = null;
	}

}
