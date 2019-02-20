import { Action, State, Types } from "../types";

declare global {
  interface Window {
    state: State;
  }
  var acquireVsCodeApi: () => {
    postMessage(msg: any): any;
    getState(): State;
    setState(state: State): any;
  };
}

export const vscode = acquireVsCodeApi();
export function dispatch(cmd: Action) {
  vscode.postMessage(cmd);
}
export function showWarning(msg: string) {
  dispatch({
    type: Types.SHOW_WARNING,
    payload: msg
  });
}

export type Element = number | string | JSX.Element