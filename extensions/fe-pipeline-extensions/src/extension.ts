// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

type ShowOptions = {
	preserveFocus?: boolean,
	viewColumn: vscode.ViewColumn,
};

const WS_DIR_FILE = '/workspace/.gitpod/config.json';

const setWsData = (key: string, value: string | null) => {
	let data = {} as any;
	if(!existsSync(WS_DIR_FILE)) {
		if(!existsSync(path.dirname(WS_DIR_FILE))) {
			mkdirSync(path.dirname(WS_DIR_FILE));
		}
	} else {
		data = require(WS_DIR_FILE);
	}
	if(value === null || value === undefined) {
		delete data[key];
	} else {
		data[key] = value;
	}
	writeFileSync(WS_DIR_FILE, JSON.stringify(data))
};

const getWsData = (key: string) =>  {
	if(existsSync(WS_DIR_FILE)) {
		let data = require(WS_DIR_FILE);
		return data[key];
	} 
}

let panel: vscode.WebviewPanel | null = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fe-pipeline-extensions" is now active!');

	// // 创建 webview
	panel = vscode.window.createWebviewPanel(
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

	panel.onDidDispose(() => {
		panel = null;
	});

	panel.dispose();


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

	if(GITPOD_TASKS) {
		try{

			const gitpodTask = JSON.parse(GITPOD_TASKS);

			for(const taskIndex in gitpodTask ) {
				const taskObj = gitpodTask[taskIndex];
				const taskName = `task_${taskIndex}`;
				const storeKey = `cmd_${taskIndex}`;
				const isCompleteTask = getWsData(storeKey);
				if(isCompleteTask) {
					continue;
				}
				setWsData(storeKey, 'true',);
				let ter = vscode.window.terminals.find(item => item.name === taskName);
				if(!ter) {
					ter = vscode.window.createTerminal(taskName);
					let cmd = 'ls';
					if(taskObj.init && taskObj.command) {
						cmd = ` (${ taskObj.init }) && ( ${ taskObj.command })`;
					} else if(taskObj.command) {
						cmd = taskObj.command;
					}
					ter.sendText(cmd, true);
					ter.show();
					vscode.window.onDidCloseTerminal((t) => {
						setWsData(storeKey, null);
					});
				}
			}

		} catch(e) {
			console.error(e);
		}
	}

	const GITPOD_PORTS = process.env.GITPOD_PORTS;

	if(GITPOD_PORTS) {
		const gitpodPorts = JSON.parse(GITPOD_PORTS) as any[];

		// (async () => {
			let handled: number[] = [];
			try{
				for(const portIndex in gitpodPorts ) {
					const portObj = gitpodPorts[portIndex];
					if(!handled.includes(portIndex as any) && portObj.onOpen !==  'ignore' ) {
						handled.push(portIndex as any);
						vscode.commands.executeCommand('simpleBrowser.api.open', `${scriptUri.scheme}://${scriptUri.authority.replace(/^\d+-(.*)/, `${portObj.port}-$1`)}`, {
							preserveFocus: true,
							viewColumn: vscode.ViewColumn.Beside,
						} as ShowOptions);
						break;
					}
				}
			} catch(e) {
				console.error(e);
			}
		// })();
	}

	context.subscriptions.push(vscode.window.registerExternalUriOpener(
		'myExtension.opener',
		{
			canOpenExternalUri(uri: vscode.Uri) {

				// Check if a URI can be opened.
				// This is called when the user first selects a link and VS Code
				// needs to determine which openers are available.

				if (uri.authority.includes('localhost')) {
					// This opener has default priority for this URI.
					// This will result in the user being prompted since VS Code always has
					// its own default opener.
					return vscode.ExternalUriOpenerPriority.Default;
				}

				// The opener can be used but should not be used by default
				return vscode.ExternalUriOpenerPriority.Option;
				
			},
			openExternalUri(resolveUri: vscode.Uri) {

				// vscode.open
				console.log(resolveUri.toString());
				let port = resolveUri.authority.replace(/^.*:(\d+)/, '$1') as string;
				if(!port.match(/^\d+$/)) {
					port = '80';
				}
				vscode.commands.executeCommand('simpleBrowser.api.open', `${scriptUri.scheme}://${scriptUri.authority.replace(/^\d+-(.*)/, `${port}-$1`)}`, {
					preserveFocus: true,
					viewColumn: vscode.ViewColumn.Beside,
				} as ShowOptions);

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
        vscode.window.showInformationMessage(`Hello World!`);

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

	if(panel) {
	  panel.dispose();
	}
	// clearAllWsData();

 }
