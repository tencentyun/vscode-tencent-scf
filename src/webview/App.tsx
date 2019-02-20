import * as React from "react";
import { State, Action, Types, Fetcher } from "../types";
import { vscode, dispatch, showWarning } from "./util";
import Invoke from "./Invoke";
import Info from "./Info";
import Row from "./component/Row";
import "./App.css";
import {
  INVALID_SERVERLESS_ENV,
  INVALID_SERVERLESS_TENCENT,
  INVALID_SERVERLESS_PROJECT
} from "../constants";
import NoServerless from "./NoServerless";
import NoTencent from "./NoTencent";
import NoProject from "./NoProject";
import AsyncButton from "./component/AsyncButton";
import { Provider } from "./context";

class App extends React.Component<any, State> {
  state: State = vscode.getState() || {};
  componentWillMount() {
    window.addEventListener("message", msg => {
      const { type, payload: state } = msg.data;
      if (type === "setState") {
        this.storageSetState(state);
      }
    });
    vscode.postMessage({ type: Types.INIT });
  }
  storageSetState(state: Partial<State>) {
    return this.setState(prevState => {
      const newState = {
        ...prevState,
        ...state
      };
      vscode.setState(newState);
      return newState;
    });
  }
  render() {
    return (
      <Provider value={{ fetcher: this.state.execute }}>
        {this.renderChildren()}
      </Provider>
    );
  }
  renderChildren() {
    const { config, deploy, jsonFiles, invoke, jsonFile, execute } = this.state;
    let { functionKey } = this.state;
    if (!config || config.loading) {
      return <p>读取Serverless配置中...</p>;
    }
    // 判断没有serverless
    if (config.error === INVALID_SERVERLESS_ENV) {
      return <NoServerless />;
    }
    // 判断是不是serverless项目
    if (config.error === INVALID_SERVERLESS_PROJECT) {
      return <NoProject />;
    }
    // 判断没有配置provider为tencent
    if (config.error === INVALID_SERVERLESS_TENCENT) {
      return <NoTencent />;
    }
    if (config.error || !config.data) {
      return <p>读取Serverless配置出错：{JSON.stringify(config.error)}</p>;
    }
    const service = config.data;
    const functionKeys = Object.keys(service.functions);
    if (!functionKeys.length) {
      functionKey = "";
    } else if (!(functionKey in service.functions)) {
      functionKey = functionKeys[0];
    }
    return (
      <div className="App">
        <p>
          <AsyncButton
            fetcher={deploy}
            onClick={() =>
              dispatch({
                type: Types.DEPLOY
              })
            }
          >
            上传服务至云函数
          </AsyncButton>
        </p>
        <Info config={config.data} functionKey={functionKey}>
          <Row label="函数">
            {functionKeys.length > 1 ? (
              <select
                value={functionKey}
                onChange={e => {
                  this.storageSetState({
                    functionKey: e.target.value
                  });
                }}
              >
                {functionKeys && functionKeys.length ? (
                  functionKeys.map(name => <option value={name}>{name}</option>)
                ) : (
                  <option>没有定义函数</option>
                )}
              </select>
            ) : (
              functionKey
            )}{" "}
            <button
              className="s"
              disabled={deploy && deploy.loading}
              onClick={() => {
                if (deploy && deploy.loading) {
                  return;
                }
                dispatch({
                  type: Types.DEPLOY,
                  payload: functionKey
                });
              }}
            >
              上传
            </button>
          </Row>
        </Info>
        <p>
          <Invoke
            onInvoke={jsonFile => {
              if (!functionKey) {
                return showWarning("请选择函数");
              }
              if (!jsonFile) {
                return showWarning("请选择数据模板");
              }
              dispatch({
                type: Types.INVOKE,
                functionName: functionKey,
                jsonFile: jsonFile
              });
            }}
            jsonFiles={jsonFiles}
            jsonFile={jsonFile}
            onJsonFile={jsonFile => this.storageSetState({ jsonFile })}
            invoke={invoke}
          />
        </p>
      </div>
    );
  }
}

export default App;
