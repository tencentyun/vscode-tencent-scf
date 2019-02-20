// 已创建的一些资源，比如 output、webview-panel
import * as vscode from "vscode";

interface Context {
  root: string
  extensionPath: string
  /** webview panel */
  panel: vscode.WebviewPanel;
  output: vscode.OutputChannel;
  status: vscode.StatusBarItem

  provider: Promise<string>
}

export default {} as Context;