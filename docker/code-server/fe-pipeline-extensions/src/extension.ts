// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketService } from './websocket-services';
import { exec } from 'child_process';
import { promisify } from 'util';
const readline = require('readline');


type ShowOptions = {
	preserveFocus?: boolean,
	viewColumn: vscode.ViewColumn,
};

let isBreak = false;

let wss: WebSocketService|null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	const WS_DIR_FILE = path.join(`${(context?.storageUri?.authority || `/workspace/.gitpod`)}`, 'config.json') // '/workspace/.gitpod/config.json';

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


	(() => {
		const terName = '__system';

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
				
				console.log('接收到命令:', params);

				let cmd = params.content;

				let cmdCwd = '/pwd';

				if(vscode?.workspace?.workspaceFolders) {
					cmdCwd = vscode?.workspace?.workspaceFolders[0].uri.path;
				}

				try{
					const res: any = await new Promise((resolve, reject) => {
						exec(cmd, { cwd: cmdCwd }, (err, stdout, stderr) => {
							if(err) {
								reject(err);
								return;
							}
							resolve({
								stdout, stderr,
							});
						});
					});

					// const res = await promisify(exec)(`${cmd}`);
					client.send({
						...params,
						status: 'success',
						content: res.stdout,
						...res,
					});
				}catch(e) {
					console.error(e);
					client.send({
						...params,
						status: 'failed',
						content: e.message,
					});
				}

				// let _cmd = `(${cmd}) ; exit $?`;

				// const ter = vscode.window.terminals.find(item => item.name === terName ) || vscode.window.createTerminal(terName);
				// ter.show();
				// vscode.window.onDidCloseTerminal((t) => {
				// 	if(t.name === terName) {
				// 		if(t.exitStatus?.code === 0) {
				// 			client.send({
				// 				...params,
				// 				status: 'success',
				// 				content: '命令执行成功',
				// 			});
				// 		} else {
				// 			client.send({
				// 				...params,
				// 				status: 'failed',
				// 				content: `命令执行失败: ${t.exitStatus?.code}`,
				// 			});
				// 		}
				// 	}
				// });

				// ter.sendText(_cmd, true);

				// await ter.processId;
			});

			console.log('命令监听开启');
		}, 0);
	})();

	// 在你的内容中引用它
	// panel.webview.html = `<!DOCTYPE html>
	// <html>
	// <body>
	// 	<div>Hello</div>
	// 	<script src="${scriptUri}"></script>
	// </body>
	// </html>`;
	// http://23000-10-1-0-79.ws.fe-pipeline.localhost/webview/vscode-resource/file///workspace/.user-code-data-dir/extensions/fe-pipeline.fe-pipeline-extensions-0.0.1/res/main.js

	const GITPOD_TASKS = process.env.GITPOD_TASKS;

	if (GITPOD_TASKS) {
		try {

			const gitpodTask = JSON.parse(GITPOD_TASKS);

			for (const taskIndex in gitpodTask) {
				const taskObj = gitpodTask[taskIndex];
				const taskName = `task_${taskIndex}`;
				const storeKey = `cmd_${taskIndex}`;
				const isCompleteTask = getWsData(storeKey);
				if (isCompleteTask) {
					continue;
				}
				setWsData(storeKey, 'true',);
				let ter = vscode.window.terminals.find(item => item.name === taskName);
				if (!ter) {
					ter = vscode.window.createTerminal(taskName);
					let cmd = 'ls';
					if (taskObj.init && taskObj.command) {
						cmd = ` (${taskObj.init}) && ( ${taskObj.command})`;
					} else if (taskObj.command) {
						cmd = taskObj.command;
					}
					ter.sendText(cmd, true);
					ter.show();
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

	const GITPOD_PORTS = process.env.GITPOD_PORTS;

	if (GITPOD_PORTS) {

		let handled: number[] = [];

		async function getTcpFilePorts() {

			const fnNetTCP = "/proc/net/tcp";

			const ports: number[] = [];
			const portReg = /^\s*\w+:\s*\w+:(\w+)\s+\w+:\w+\s+0A\s+/;

			const fileStream = fs.createReadStream(fnNetTCP);
			const rl = readline.createInterface({
				input: fileStream,
				crlfDelay: Infinity
			});
			// 注意：我们使用 crlfDelay 选项将 input.txt 中的所有 CR LF 实例（'\r\n'）识别为单个换行符。
			// input.txt 中的每一行在这里将会被连续地用作 `line`。
			for await (const line of rl) {
				if (line) {
					const res = portReg.exec(line);
					if (res) {
						ports.push(parseInt(res[1], 16));
						//   console.log(`Line from file: ${line}`);
					}
				}
			}
			fileStream.close();
			return ports;
		}

		const handleGitpodPorts = (currentOpen: number[]) => {
			try {
				const gitpodPorts = JSON.parse(GITPOD_PORTS) as any[];
				for (const portIndex in gitpodPorts) {
					if(handled.includes(portIndex as any) ) {
						continue;
					}
					const portObj = gitpodPorts[portIndex];
					if(!currentOpen.includes(+portObj.port)) {
						continue;
					}
					if (portObj.onOpen !== 'ignore') {
						handled.push(portIndex as any);
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
		}

		(async () => {

			const fnNetTCP = "/proc/net/tcp";

			if (!fs.existsSync(fnNetTCP)) {
				return [];
			}

			while (!isBreak) {

				const currentPorts = await getTcpFilePorts();

				// console.log(`currentPorts: ${currentPorts.join(',')}`);

				handleGitpodPorts(currentPorts);

				await new Promise((resolve) => {
					setTimeout(() => {
						resolve(null);
					}, 3000);
				})
			}
		})();
	}

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
	let disposable = vscode.commands.registerCommand('fe-pipeline-extensions.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage(`Hello World! ${WS_DIR_FILE}`);

		// vscode.window.showInformationMessage(`Url! ${scriptUri.scheme}://${scriptUri.authority}`);

		// // // 创建 webview
		// const panel = vscode.window.createWebviewPanel(
		// 	'catWebview',
		// 	'Cat Webview',
		// 	vscode.ViewColumn.Beside,
		// 	{
		// 		enableScripts: true,
		// 		retainContextWhenHidden: false,
		// 	}
		// );

		// // 获取内容的 Uri
		// const scriptUri = panel.webview.asWebviewUri(
		// 	vscode.Uri.file(path.join(context.extensionPath, 'res', 'main.js'))
		// );

		// // 在你的内容中引用它
		// panel.webview.html = `<!DOCTYPE html>
		// <html>
		// <body>
		// 	<div>Hello</div>
		// 	<script src="${scriptUri}"></script>
		// </body>
		// </html>`;

		// panel.webview.onDidReceiveMessage((e) => {
		// 	console.log(e);
		//     panel.dispose();
		// }, null);

		// const scriptUri = panel.webview.asWebviewUri(
		//   vscode.Uri.file(path.join(context.extensionPath, 'res', 'main.js'))
		// );
		// panel.dispose();

		// vscode.commands.executeCommand('simpleBrowser.api.open', 'https://www.baidu.com', {
		// 	preserveFocus: true,
		// 	viewColumn: vscode.ViewColumn.Beside,
		// } as ShowOptions);

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {

	isBreak = true;

	// if(panel) {
	//   panel.dispose();
	// }
	// clearAllWsData();

	if(wss) {
		wss.close();
		wss = null;
	}

}
