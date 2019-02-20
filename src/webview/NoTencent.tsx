// 如果有serverless环境，但没有配置provider为Tencent
import * as React from "react";
import Command from "./component/Command";

export default function() {
  return (
    <React.Fragment>
      <p>仅支持腾讯云SCF，也即provider为tencent并安装了相关插件</p>
      <p>
        如果您使用的是腾讯云，请将serverless配置文件中的provider.name配置为tencent
      </p>
      <p>
        同时安装SCF插件： <Command>serverless plugin install --name serverless-tencent-scf</Command>
      </p>
    </React.Fragment>
  );
}
