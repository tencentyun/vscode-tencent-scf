export interface ServerlessResult<T = any> {
  success: boolean;
  data: T;
  error: any;
}

/**
 * 读取到的配置文件
 */
export interface Service {
  name: string;
  provider: ServiceProvider;
  functions: {
    [key: string]: ServiceFunction;
  };
}
export interface ServiceProvider {
  /** 如：aws、tencent */
  name: string;
  namespace?: string;
  region: string;
  runtime: string;
  credentials: string;
  // 默认配置
  memorySize?: number;
  timeout?: number;
  vpc?: string;
  gpu?: boolean;
  environment?: {
    [key: string]: string;
  };
}
export interface ServicePackage {
  /** 打包后的zip文件路径 */
  artifact: string;
}
export interface ServiceFunction {
  name?: string;
  namespace?: string;
  handler: string;
  description?: string;
  events?: ServiceFunctionTriggerWrap[];
  memorySize?: number;
  timeout?: number;
  vpc?: string;
  gpu?: boolean;
  environment?: {
    [key: string]: string;
  };
}

export interface ServiceFunctionTriggerWrap {
  [type: string]: ServiceFunctionTrigger;
}

export type ServiceFunctionTrigger =
  | TimerTriggerOptions
  | CmqTriggerOptions
  | COSTriggerOptions
  | CKafkaTriggerOptions
  | APIGatewayTriggerOptions;

export interface TimerTriggerOptions {
  name: string;
  cron: string;
  //interval: number
}
export interface CmqTriggerOptions {
  instance: string;
}
export interface COSTriggerOptions {
  bucket: string;
  event: string;
  prefix: string;
  suffix: string;
}
export interface CKafkaTriggerOptions {
  instance: string;
  topic: string;
  batchSize: number;
}
export interface APIGatewayTriggerOptions {
  /** 仅支持ID形式 */
  service: string;
  method: string;
  stage: string;
  auth: boolean;
}

export interface FunctionLog {
  /**  函数的名称  */
  FunctionName: string;
  /**  函数执行完成后的返回值  */
  RetMsg: string;
  /**  执行该函数对应的requestId  */
  RequestId: string;
  /**  函数开始执行时的时间点  */
  StartTime: string;
  /**  函数执行结果，如果是 0 表示执行成功，其他值表示失败  */
  RetCode: number;
  /**  函数调用是否结束，如果是 1 表示执行结束，其他值表示调用异常  */
  InvokeFinished: number;
  /**  函数执行耗时，单位为 ms  */
  Duration: number;
  /**  函数计费时间，根据 duration 向上取最近的 100ms，单位为ms  */
  BillDuration: number;
  /**  函数执行时消耗实际内存大小，单位为 Byte  */
  MemUsage: number;
  /**  函数执行过程中的日志输出  */
  Log: string;
}

export interface InvokeResponse {
  /**  函数执行结果  */
  Result: Result;
  /**  唯一请求ID，每次请求都会返回。定位问题时需要提供该次请求的RequestId。  */
  RequestId: string;
}

export interface Result {
  /**  表示执行过程中的日志输出，异步调用返回为空  */
  Log: string;
  /**  表示执行函数的返回，异步调用返回为空  */
  RetMsg: string;
  /**  表示执行函数的错误返回信息，异步调用返回为空  */
  ErrMsg: string;
  /**  执行函数时的内存大小，单位为Byte，异步调用返回为空  */
  MemUsage: number;
  /**  表示执行函数的耗时，单位是毫秒，异步调用返回为空  */
  Duration: number;
  /**  表示函数的计费耗时，单位是毫秒，异步调用返回为空  */
  BillDuration: number;
  /**  此次函数执行的Id  */
  FunctionRequestId: string;
  /**  0为正确，异步调用返回为空  */
  InvokeResult: number;
}

export interface State {
  config: Fetcher<Service>;
  deploy: Fetcher<null>;
  remove: Fetcher<null>;
  jsonFiles: Fetcher<string[]>;
  invoke: Fetcher<InvokeResponse>;
  functionKey: string;
  jsonFile: string;
  execute: Fetcher<boolean>;
}

type FilterByValue<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never
}[keyof T]
export type StateBooleanFetcherProperty = FilterByValue<State, Fetcher<boolean>>

export interface Fetcher<T> {
  loading: boolean;
  data: T | undefined;
  error: any;
}
interface BaseAction {
  type: Types;
}
export enum Types {
  /** webview初始化 */
  INIT,
  /** webview主动刷新 */
  RELOAD,
  /** 发布到云端 */
  DEPLOY,
  /** 云端调用 */
  INVOKE,
  /** 创建测试模板 */
  CREATE_EVENT,
  /** 展示告警信息 */
  SHOW_WARNING,
  /** 展示提示信息 */
  SHOW_INFORMATION,
  /** 执行指令 */
  EXECUTE
}
interface SimpleAction extends BaseAction {
  type: Types.INIT | Types.RELOAD;
}
interface ExecuteAction extends BaseAction {
  type: Types.EXECUTE;
  payload: string;
}
interface DeployAction extends BaseAction {
  type: Types.DEPLOY;
  payload?: string;
}
interface InvokeAction extends BaseAction {
  type: Types.INVOKE;
  functionName: string;
  jsonFile: string;
}
interface CreateEventAction extends BaseAction {
  type: Types.CREATE_EVENT;
}
interface TipAction extends BaseAction {
  type: Types.SHOW_WARNING | Types.SHOW_INFORMATION;
  payload: string;
}
export type Action =
  | SimpleAction
  | DeployAction
  | InvokeAction
  | CreateEventAction
  | TipAction
  | ExecuteAction;
