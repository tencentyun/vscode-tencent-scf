// 如果没有serverless环境，提示之
import * as React from "react";
import Command from "./component/Command";

export default function() {
  return (
    <React.Fragment>
      <p>
        本插件依赖Serverless Framework(<a href="https://github.com/serverless/serverless">https://github.com/serverless/serverless</a>)
      </p>
      <p>全局安装，请执行 <Command>npm install -g serverless</Command></p>
      {/* <p>本地目录安装，请执行 <Command>npm install serverless</Command></p> */}
    </React.Fragment>
  );
}
