import * as React from "react";
import { dispatch, showWarning } from "./util";
import { Types, ServerlessResult, InvokeResponse, Fetcher } from "../types";
import AsyncSelect from "./component/AsyncSelect";
import Table from "./component/Table";
import Row from "./component/Row";

export interface Props {
  jsonFiles: Fetcher<string[]>;
  jsonFile: string;
  onJsonFile: (jsonFile: string) => any;
  invoke?: Fetcher<InvokeResponse>;
  onInvoke?: (jsonPath: string) => any;
}
export default function Invoke(props: Props) {
  const { onInvoke = () => {}, jsonFiles, onJsonFile, invoke } = props;
  const defaultJsonPath = jsonFiles.data ? jsonFiles.data[0] : "";
  const { jsonFile = defaultJsonPath } = props;
  return (
    <React.Fragment>
      <p>
        使用测试模板：
        <AsyncSelect
          fetcher={jsonFiles}
          toItem={s => ({ text: s, value: s })}
          selected={jsonFile}
          emptyText={"没有调用模板"}
          onChange={item => onJsonFile(item ? item.value : "")}
        />{" "}
        <a href="#" onClick={() => dispatch({ type: Types.CREATE_EVENT })}>
          新建
        </a>
      </p>
      <button
        disabled={invoke && invoke.loading}
        onClick={() => !(invoke && invoke.loading) && onInvoke(jsonFile)}
      >
        运行函数
      </button>
      <InvokeResult fetcher={invoke} />
    </React.Fragment>
  );
}

function InvokeResult(props: { fetcher: Fetcher<InvokeResponse> | undefined }) {
  const { fetcher } = props;
  if (!fetcher) {
    return <noscript />;
  }
  if (fetcher.loading) {
    return <p>{"调用中..."}</p>;
  }
  if (fetcher.error) {
    return <p>{`调用失败：${JSON.stringify(fetcher.error)}`}</p>;
  }
  if (!fetcher.data) {
    return <p>调用异常</p>;
  }
  const { RequestId, Result } = fetcher.data;
  return (
    <div className="result">
      <p className="result-label">函数返回：</p>
      <p>
        <pre>{Result.RetMsg}</pre>
      </p>
      <p className="result-label">函数日志：</p>
      <p>
        <pre>{Result.Log}</pre>
      </p>
      <p className="result-label">摘要：</p>
      <Table>
        <Row label="请求ID">{RequestId}</Row>
        <Row label="运行时间">{`${Result.Duration}ms`}</Row>
        <Row label="计费时间">{`${Result.BillDuration}ms`}</Row>
        <Row label="占用内存">{`${(Result.MemUsage / 1024 / 1024).toFixed(
          3
        )}MB`}</Row>
      </Table>
    </div>
  );
}
// type StaticContent = string  | JSX.Element | JSX.Element[]
// type DynamicContent<TInput> = (input: TInput) => StaticContent
// type Content<TInput = any> = StaticContent | DynamicContent<TInput>

// interface LoadingProps<T>{
//     fetcher: Fetcher<T>
//     loading: Content
//     error: Content
//     children: Content<T>
// }
// function Loading<T>(props: LoadingProps<T>){
//     const {fetcher, loading, error, children} = props
//     if(fetcher.loading) {
//         return loading
//     }
// }
