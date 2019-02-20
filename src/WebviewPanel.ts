import * as vscode from "vscode";
import * as pt from "path";
import { promisify } from "util";
import * as fs from "fs";
import Base from "./ReactPanel";
import { deploy, invoke, getConfig, getProvider } from "./cli";
import {
  Service,
  InvokeResponse,
  ServerlessResult,
  Action,
  Types,
  State,
  Fetcher,
  StateBooleanFetcherProperty
} from "./types";
import {
  EVENTS_DIR,
  EVENT_EXT,
  INVALID_SERVERLESS_ENV,
  INVALID_SERVERLESS_TENCENT
} from "./constants";
import ctx from "./context";
import { cpUtils } from "./utils/cpUtils";

const readdir = promisify(fs.readdir);

export class Serializer implements vscode.WebviewPanelSerializer {
  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: State
  ) {
    console.log("deserializeWebviewPanel");
    Panel.createOrShow(webviewPanel).setState(state);
  }
}

export default class Panel extends Base {
  public static currentPanel: Panel | undefined;
  protected dirtyState: Partial<State> | undefined;
  get title() {
    return "腾讯云SCF";
  }
  // 当webview处于隐藏状态时，自动缓存没有同步的值
  setState(state: Partial<State>) {
    console.log(
      `visible: ${this._panel.visible} setState: ${JSON.stringify(state)}`
    );
    if (this._panel.visible) {
      if (this.dirtyState) {
        state = Object.assign(this.dirtyState, state);
      }
      return super.setState(state);
    }
    this.dirtyState = Object.assign(this.dirtyState || {}, state);
  }
  flushState() {
    this.setState({});
  }
  async afterInit() {
    await Promise.all([this.reloadConfig(), this.reloadJsonFiles()]);
  }
  async fetchWith<T>(
    task: () => Promise<T>,
    update: (state: Fetcher<T>) => any
  ) {
    // 开始
    update({
      loading: true,
      data: undefined,
      error: null
    });
    try {
      const result = await task();
      update({
        loading: false,
        data: result,
        error: null
      });
    } catch (e) {
      ctx.output.show();
      update({
        loading: false,
        data: undefined,
        error: e.message || e
      });
    }
  }

  async reloadConfig() {
    await this.fetchWith(
      async () => {
        // let providerTask: Promise<string>;
        let provider: string = "";
        // let resultTask: Promise<ServerlessResult<Service>>;
        let result: ServerlessResult<Service>;
        try {
          // 并行启动执行？考虑性能冲击，改为串行吧，看下耗时
          provider = await ctx.provider;
          // 不是有效的腾讯云SCF项目
          if (provider !== "tencent") {
            throw INVALID_SERVERLESS_TENCENT;
          }
          result = await getConfig();
        } catch (e) {
          if (typeof e === "string") {
            throw e;
          }
          // 如果读取到了provider，则表明serverless环境ok，但serverless-tencent-scf有问题
          // 从而导致 serverless tencent getconfig出错
          if (provider) {
            throw INVALID_SERVERLESS_TENCENT;
          }
          // 不是有效的serverless环境
          throw INVALID_SERVERLESS_ENV;
        }
        if (!result.success) {
          throw result.error;
        }
        return result.data;
      },
      state => this.setState({ config: state })
    );
  }

  async deploy(functionName?: string) {
    await this.fetchWith(
      async () => {
        const result = await deploy(functionName);
        if (!result.success) {
          throw result.error;
        }
        vscode.window.showInformationMessage(
          functionName ? `函数${functionName}发布成功` : `服务发布成功`
        );
        return null;
      },
      state => this.setState({ deploy: state })
    );
  }

  async invoke(functionName: string, jsonFile: string) {
    await this.fetchWith(
      async () => {
        const result = await invoke(functionName, jsonFile);
        if (!result.success) {
          throw result.error;
        }
        return result.data;
      },
      state => this.setState({ invoke: state })
    );
  }

  async reloadJsonFiles() {
    await this.fetchWith(pickupEventList, state =>
      this.setState({ jsonFiles: state })
    );
  }

  async executeCommand(cmd: string) {
    ctx.output.show();
    await this.fetchWith(
      async () => {
        await cpUtils.executeCommand(ctx.output, ctx.root, cmd);
        vscode.window.showInformationMessage(`指令${cmd}执行完成`);
        return true;
      },
      state => this.setState({ execute: state })
    );
  }

  protected async processMessage(cmd: Action) {
    console.log(`Action: ${cmd.type}`);
    switch (cmd.type) {
      case Types.INIT:
        this.flushState();
        break;
      case Types.RELOAD:
        this.reloadConfig();
        this.reloadJsonFiles();
        break;
      case Types.SHOW_WARNING:
        vscode.window.showWarningMessage(cmd.payload);
        break;
      case Types.SHOW_INFORMATION:
        vscode.window.showInformationMessage(cmd.payload);
        break;
      case Types.DEPLOY:
        await this.deploy(cmd.payload);
        break;
      case Types.EXECUTE:
        await this.executeCommand(cmd.payload);
        break;
      case Types.INVOKE:
        if (!cmd.functionName) {
          vscode.window.showWarningMessage("请选择调用函数");
        }
        if (!cmd.jsonFile) {
          vscode.window.showWarningMessage("请选择测试模板");
        }
        await this.invoke(cmd.functionName, cmd.jsonFile);
        break;
      case Types.CREATE_EVENT:
        await assureEventDir();
        // 创建空文件
        const filePath = pt.join(
          ctx.root,
          EVENTS_DIR,
          "" + Date.now() + EVENT_EXT
        );
        await promisify(fs.writeFile)(filePath, JSON.stringify({}, null, "\t"));
        // 打开
        const doc = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(doc, {
          selection: new vscode.Range(
            new vscode.Position(0, 1),
            new vscode.Position(0, 1)
          )
        });

        //  同步文件列表
        await this.reloadJsonFiles();
        break;
    }
  }
}

async function assureEventDir(detectOnly = false) {
  // 判断events目录存在
  if (!ctx.root) {
    // vscode.window.showErrorMessage("无法判断工程根目录");
    // return;
    throw new Error("无法判断工程根目录");
  }
  const eventDir = pt.join(ctx.root, EVENTS_DIR);
  let eventDirStat: fs.Stats | null = null;
  try {
    eventDirStat = await promisify(fs.stat)(eventDir);
  } catch (e) {}
  if (!eventDirStat) {
    if (detectOnly) {
      return false;
    }
    // 创建
    await promisify(fs.mkdir)(eventDir);
  } else if (!eventDirStat.isDirectory()) {
    if (detectOnly) {
      return false;
    }
    throw new Error("目录不存在");
  }
  return true;
}
async function pickupEventList(): Promise<string[]> {
  const eventDirExists = await assureEventDir(true);
  if (!eventDirExists) {
    return [];
  }
  const files = await readdir(pt.join(ctx.root, EVENTS_DIR));
  return files
    .filter(f => f.endsWith(EVENT_EXT))
    .map(f => `${EVENTS_DIR}${pt.sep}${f}`);
}
