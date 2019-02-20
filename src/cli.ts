// 封装命令行工具的各指令
import * as cp from "child_process";
import * as vscode from "vscode";
import * as pt from "path";
import { cpUtils } from "./utils/cpUtils";
import context from "./context";
import {
  ServerlessResult,
  Service,
  FunctionLog,
  InvokeResponse
} from "./types";

// 这里可以考虑在底层再封装一次task，这样就可以直接用vs自带的task执行
// 自带task的好处：可以自定义快捷键，但它似乎只是针对用户层面，而不是插件 - 放弃

// 如何让插件依赖项目中的指定npm包？似乎并不行

/**
 * 快速获取serverless中的provider，就算不是腾讯云也能获取到信息
 */
export async function getProvider(): Promise<string> {
  const result = await execute<{success: boolean, data: string, error: any}>(
    `node ${pt.join(context.extensionPath, "out", "getProvider")}`
  );
  if(result.success){
    return result.data
  }
  throw result.error
}

/**
 * 获取serverless配置，注意这里是修正过的
 */
export async function getConfig(): Promise<ServerlessResult<Service>> {
  return executeServerless("tencent getconfig");
}

/**
 * 发布
 */
export async function deploy(name?: string): Promise<ServerlessResult> {
  return executeServerless("deploy", ...(name ? [`function --function ${name}`] : []));
}

/**
 * 删除
 */
export async function remove(name?: string): Promise<ServerlessResult> {
  return executeServerless("remove", name ? `--function ${name}` : "");
}

/**
 * 查询日志
 */
export async function getLogs(
  name: string,
  requestId: string
): Promise<ServerlessResult<FunctionLog[]>> {
  return executeServerless(
    "logs",
    "--function",
    name,
    "--requestId",
    requestId
  );
}

/**
 * 调用
 */
export async function invoke(
  name: string,
  data: string
): Promise<ServerlessResult<InvokeResponse>> {
  return executeServerless("invoke", "--function", name, "--path", data);
}

/** 安装serverless环境 - 考虑让用户手动，我们只用检测 */
export async function installServerless(){
  return execute("npm install -g serverless")
}

/** 安装serverless-tencent-scf插件 */
export async function installScfPlugin(){
  return execute("serverless plugin install --name serverless-tencent-scf ")
}

async function executeServerless<T = any>(...args: string[]) {
  return execute<T>("serverless", ...args);
}
async function execute<T = any>(cmd: string, ...args: string[]): Promise<T> {
  // 注意，serverless package（或deploy）在插件调试时会卡住，怀疑是文件权限问题
  const result = await cpUtils.executeCommand(
    context.output,
    context.root,
    // "node",
    // "node_modules/serverless/bin/serverless",
    cmd,
    ...args
  );
  const jsons = pickupJsons(result.cmdOutputIncludingStderr);
  return jsons[0];
}

export function pickupJsons(cliOutput: string) {
  const jsonStrings: any[] = [];
  // 先找到 jsonBoundary 声明
  let matched = cliOutput.match(/jsonBoundary\(([\w-]+)\)/);
  if (!matched) {
    return jsonStrings;
  }
  const [, jsonBoundary] = matched;
  // 找出所有json输出
  const regex = new RegExp(
    `${jsonBoundary}\\(([\\s\\S]+?)\\)${jsonBoundary}`,
    "g"
  );
  while ((matched = regex.exec(cliOutput))) {
    const [, json] = matched;
    try {
      jsonStrings.push(JSON.parse(json));
    } catch (e) {}
  }
  return jsonStrings;
}
