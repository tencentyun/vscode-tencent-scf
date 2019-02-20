/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from "child_process";
import * as os from "os";
import * as vscode from "vscode";

export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux"
}
export const isWindows: boolean = /^win/.test(process.platform);

export namespace cpUtils {
  export async function executeCommand(
    outputChannel: vscode.OutputChannel | undefined,
    workingDirectory: string | undefined,
    command: string,
    ...args: string[]
  ) {
    const result: ICommandResult = await tryExecuteCommand(
      outputChannel,
      workingDirectory,
      command,
      ...args
    );
    if (result.code !== 0) {
      // We want to make sure the full error message is displayed to the user, not just the error code.
      // If outputChannel is defined, then we simply call 'outputChannel.show()' and throw a generic error telling the user to check the output window
      // If outputChannel is _not_ defined, then we include the command's output in the error itself and rely on AzureActionHandler to display it properly
      if (outputChannel) {
        outputChannel.show();
        throw new Error(`执行指令 ${command} 失败，请查看 输出 窗口查看详情`);
      } else {
        throw new Error(
          `执行指令 ${command} ${result.formattedArgs} 失败，退出代码 "${
            result.code
          }":${os.EOL}${result.cmdOutputIncludingStderr}`
        );
      }
    } else {
      if (outputChannel) {
        outputChannel.appendLine(
          `执行指令 ${command} ${result.formattedArgs} 完成`
        );
      }
    }
    return result;
  }

  export async function tryExecuteCommand(
    outputChannel: vscode.OutputChannel | undefined,
    workingDirectory: string | undefined,
    command: string,
    ...args: string[]
  ): Promise<ICommandResult> {
    return await new Promise(
      (
        resolve: (res: ICommandResult) => void,
        reject: (e: Error) => void
      ): void => {
        let cmdOutput: string = "";
        let cmdOutputIncludingStderr: string = "";
        const formattedArgs: string = args.join(" ");

        workingDirectory = workingDirectory || os.tmpdir();
        const options: cp.SpawnOptions = {
          cwd: workingDirectory,
          env: {
            ...process.env,
            JSON_OUTPUT: "1",
            SLS_DEBUG: "*",
            HTTPS_PROXY: vscode.workspace.getConfiguration("http").get("proxy")
          },
          shell: true
        };
        const childProc: cp.ChildProcess = cp.spawn(command, args, options);

        if (outputChannel) {
          outputChannel.appendLine(`执行指令 ${command} ${formattedArgs} ...`);
        }

        childProc.stdout.on("data", (data: string | Buffer) => {
          data = data.toString();
          cmdOutput = cmdOutput.concat(data);
          cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
          if (outputChannel) {
            outputChannel.append(data);
          }
        });

        childProc.stderr.on("data", (data: string | Buffer) => {
          data = data.toString();
          cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
          if (outputChannel) {
            outputChannel.append(data);
          }
        });

        childProc.on("error", reject);
        childProc.on("exit", (code: number) => {
          resolve({
            code,
            cmdOutput,
            cmdOutputIncludingStderr,
            formattedArgs
          });
        });
      }
    );
  }

  export interface ICommandResult {
    code: number;
    cmdOutput: string;
    cmdOutputIncludingStderr: string;
    formattedArgs: string;
  }

  const quotationMark: string = isWindows ? '"' : "'";
  /**
   * Ensures spaces and special characters (most notably $) are preserved
   */
  export function wrapArgInQuotes(arg: string): string {
    return quotationMark + arg + quotationMark;
  }

  export function joinCommands(
    platform: NodeJS.Platform,
    ...commands: string[]
  ): string {
    let separator: string;
    switch (platform) {
      case Platform.Windows:
        separator = " ; ";
        break;
      default:
        separator = " && ";
        break;
    }
    return commands.join(separator);
  }
}
