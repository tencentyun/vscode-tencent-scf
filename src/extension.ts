// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WEBVIEW_TYPE, OUTPUT_CHANNEL_NAME, EVENTS_DIR } from "./constants";
import ctx from "./context";
import * as pt from "path";
import Panel, { Serializer } from "./WebviewPanel";
import { remove, deploy, getConfig, getProvider } from "./cli";
import { determineWorkspaceRoot } from "./utils/root";
import { cpUtils } from "./utils/cpUtils";

// TODO 使用i18next来做国际化，最好从serverless-tencent-scf开始改造

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  ctx.root = await determineWorkspaceRoot();
  ctx.extensionPath = context.extensionPath;

  context.subscriptions.push(
    (ctx.output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME))
  );

  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(WEBVIEW_TYPE, new Serializer())
  );

  // 监听serverless.yml变化
  const slsWatcher = vscode.workspace.createFileSystemWatcher(
    pt.join(ctx.root, "serverless.{yml,yaml,json,js}")
  );
  const reloadConfig = () => {
    console.log("serverless file changed");
    detectServerlessConfig();
    if (Panel.currentPanel) {
      Panel.currentPanel.reloadConfig();
    }
  };
  slsWatcher.onDidChange(reloadConfig);
  slsWatcher.onDidCreate(reloadConfig);
  slsWatcher.onDidDelete(reloadConfig);

  // 监听events目录变化
  const eventsWatcher = vscode.workspace.createFileSystemWatcher(
    pt.join(ctx.root, EVENTS_DIR, "*.json")
  );
  const reloadJsonFiles = () => {
    console.log("events file changed");
    if (Panel.currentPanel) {
      Panel.currentPanel.reloadJsonFiles();
    }
  };
  eventsWatcher.onDidCreate(reloadJsonFiles);
  eventsWatcher.onDidDelete(reloadJsonFiles);

  // 监听指令
  for (const [cmd, fn] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
  }

  // 状态栏
  ctx.status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  ctx.status.text = "腾讯云SCF";
  ctx.status.tooltip = "打开腾讯云SCF操作面板";
  ctx.status.command = "scf.reveal";
  ctx.status.show();

  detectServerlessConfig();

  console.log(
    'Congratulations, your extension "vscode-tencent-scf" is now active!'
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("deactivate");
}

// 要注册指令的服务
const commands: Array<[string, () => any]> = [
  [
    "scf.reveal",
    async () => {
      detectServerlessConfig();
      Panel.createOrShow();
      // const config = await getConfig()
      // vscode.window.showInformationMessage(JSON.stringify(config, null, '\t'))
    }
  ],
  ["scf.deploy", deploy],
  ["scf.remove", remove]
];

// 当serverless配置变化时，进行判断
async function detectServerlessConfig() {
  let provider: string = "";
  // 判断是不是腾讯云SCF项目
  try {
    ctx.provider = getProvider();
    provider = await ctx.provider;
  } catch (e) {
    console.error(e);
    // if (ctx.status) {
    //   ctx.status.hide();
    // }
    // TODO 如果serverless环境不正确，可能需要给出指引？
  }
  if (provider === "tencent") {
    ctx.status.text = "腾讯云SCF";
    // 在状态栏上进行标注 - 或可在非tencent时展示，因这里是一次性的

    // 如果没有打开操控面板，则提示之
    if (!Panel.currentPanel) {
      const result = await vscode.window.showInformationMessage(
        "检测到当前项目为腾讯云SCF，是否打开操作面板？",
        "是",
        "否"
      );
      if (result === "是") {
        Panel.createOrShow();
      }
    }
  } else {
    ctx.status.text = "腾讯云SCF(未生效)";
    // ctx.status.hide();
  }
}

process.on("unhandledRejection", err => {
  console.error(err);
});
