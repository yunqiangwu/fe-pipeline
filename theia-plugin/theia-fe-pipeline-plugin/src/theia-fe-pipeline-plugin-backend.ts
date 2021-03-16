
/**
 * Generated using theia-plugin-generator
 */

import * as theia from '@theia/plugin';
// import { PreviewLinkNormalizer } from '@theia/preview/lib/browser/preview-link-normalizer'
// import { ContainerModule, injectable } from "inversify";
// import { PreviewLinkNormalizer } from "@theia/preview/lib/browser/preview-link-normalizer";

export function start(context: theia.PluginContext) {


    const informationMessageTestCommand = {
        id: 'hello-world-example-generated',
        label: "Hello World"
    };
    context.subscriptions.push(theia.commands.registerCommand(informationMessageTestCommand, (...args: any[]) => {
        theia.window.showInformationMessage(`Hello World! ${self.location.href}`);
        theia.commands.executeCommand('mini-browser.openUrl', 'https://www.baidu.com');
    }));

    // console.log(PreviewLinkNormalizer);

    // context.subscriptions.push(theia.window.registerExternalUriOpener(
    //     'myExtension.opener',
    //     {
    //         canOpenExternalUri(uri: theia.Uri) {
    //             // Check if a URI can be opened.
    //             // This is called when the user first selects a link and VS Code
    //             // needs to determine which openers are available.

    //             if (uri.authority === 'localhost:8080') {
    //                 // This opener has default priority for this URI.
    //                 // This will result in the user being prompted since VS Code always has
    //                 // its own default opener.
    //                 return theia.ExternalUriOpenerPriority.Default;
    //             }

    //             // The opener can be used but should not be used by default
    //             return theia.ExternalUriOpenerPriority.Option;
    //         },
    //         openExternalUri(resolveUri: theia.Uri) {
    //             console.log(resolveUri);
    //             // Actually open the URI.
    //             // This is called once the user has selected this opener.
    //         }
    //     },
    //     {
    //         schemes: ['http', 'https'],
    //         label: 'Open URL using My Extension'
    //     }
    // ));

}

export function stop() {

}




