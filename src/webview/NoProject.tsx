// 如果有serverless环境，但没有serverless项目
import * as React from "react";
import Command from "./component/Command";
import { dispatch } from "./util";
import { Types } from "../types";

export default function() {
  return (
    <React.Fragment>
      <p>请初始化serverless项目(创建serverless.yml文件)</p>
      <p>
        你可以使用
        <Command>
          serverless create --template-url
          https://github.com/tencentyun/serverless-tencent-scf/tree/master/example
          --name example
        </Command>
        来下载模板
      </p>
      <p>
        下载完成后，请将example目录的内容复制到项目根目录中
      </p>
    </React.Fragment>
  );
}
