import * as React from "react";
import { dispatch, showWarning } from "./util";
import {
  Types,
  ServerlessResult,
  InvokeResponse,
  Service,
  Fetcher,
  ServiceFunction
} from "../types";
import Table from "./component/Table";
import Row from "./component/Row";
import AsyncSelect from "./component/AsyncSelect";

export interface Props {
  config: Service;
  functionKey: string;
  children?: JSX.Element;
}
export interface State {}
export default class Info extends React.PureComponent<Props, State> {
  state: State = {};
  render() {
    const { config, children } = this.props;
    let { functionKey } = this.props;
    const {} = this.state;
    const functionKeys = Object.keys(config.functions);
    if (!(functionKey in config.functions)) {
      functionKey = functionKeys[0];
    }
    const func = config.functions[functionKey];
    return (
      <Table>
        <Row label="服务名">{config.name}</Row>
        <Row label="地域">{config.provider.region}</Row>
        <Row label="运行环境">{config.provider.runtime}</Row>
        {/* 有多个函数时，让用户选择 */}
        {children}
        {func && <FunctionInfo func={func} />}
      </Table>
    );
  }
}

interface FunctionInfoProps {
  func: ServiceFunction;
}
function FunctionInfo(props: FunctionInfoProps) {
  const { func } = props;
  return (
    <React.Fragment>
      <Row label="函数名">{func.name}</Row>
      <Row label="函数描述">{func.description}</Row>
      <Row label="所属命名空间">{func.namespace}</Row>
      <Row label="超时时间">{func.timeout}</Row>
      <Row label="配置内存">{func.memorySize}</Row>
    </React.Fragment>
  );
}
