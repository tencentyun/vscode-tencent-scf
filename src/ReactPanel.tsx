import * as vscode from "vscode";
import * as path from "path";
import { WEBVIEW_TYPE } from "./constants";
import ctx from "./context";

/**
 * @see https://github.com/rebornix/vscode-webview-react/blob/master/ext-src/extension.ts
 */
/**
 * Manages react webview panels
 */
export default class ReactPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ReactPanel | undefined;

  protected static readonly viewType = WEBVIEW_TYPE;
  protected basePath: string = "webview-build";
  protected jsEntry: string = "index.js";

  protected readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(panel?: vscode.WebviewPanel): ReactPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    // Otherwise, create a new panel.
    if (ReactPanel.currentPanel) {
      ReactPanel.currentPanel._panel.reveal(column);
    } else {
      ReactPanel.currentPanel = new this(
        column || vscode.ViewColumn.One,
        panel
      );
    }
    return ReactPanel.currentPanel;
  }

  protected constructor(
    column: vscode.ViewColumn,
    panel?: vscode.WebviewPanel
  ) {
    this._extensionPath = ctx.extensionPath;

    // Create and show a new webview panel
    this._panel =
      panel ||
      vscode.window.createWebviewPanel(
        ReactPanel.viewType,
        this.title,
        column,
        {
          // Enable javascript in the webview
          enableScripts: true,

          // And restric the webview to only loading content from our extension's `media` directory.
          localResourceRoots: [
            vscode.Uri.file(path.join(this._extensionPath, this.basePath))
          ]
        }
      );

    this.setUpWebviewPanel();

    this.afterInit();
  }

  protected setUpWebviewPanel() {
    // Set the webview's initial html content
    this._panel.webview.html = this._getHtmlForWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        this.processMessage(message);
      },
      null,
      this._disposables
    );
  }

  get title() {
    return "React";
  }

  protected afterInit() {}

  protected processMessage(message: any) {}

  setState(state: any) {
    this._panel.webview.postMessage({ type: "setState", payload: state });
  }

  public dispose() {
    ReactPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  protected _getHtmlForWebview() {
    // const manifest = require(path.join(
    //   this._extensionPath,
    //   this.basePath,
    //   "asset-manifest.json"
    // ));
    // const mainScript = manifest["main.js"];
    // const mainStyle = manifest["main.css"];

    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, this.basePath, this.jsEntry)
    );
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>${this.title}</title>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${vscode.Uri.file(
          path.join(this._extensionPath, this.basePath)
        ).with({
          scheme: "vscode-resource"
        })}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
