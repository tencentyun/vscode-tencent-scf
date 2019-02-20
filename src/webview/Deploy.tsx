import * as React from "react";
import { dispatch, showWarning } from "./util";
import { Types, ServerlessResult, InvokeResponse } from "../types";

export interface Props {
  loading: boolean;
  result?: ServerlessResult<InvokeResponse>;
}
export default class Invoke extends React.PureComponent<Props> {
  render() {
    const { loading, result } = this.props;
    const {} = this.state;
    return (
      <React.Fragment>
        <button
          onClick={() => {
            dispatch({
              type: Types.DEPLOY
            });
          }}
        >
          上传
        </button>
      </React.Fragment>
    );
  }
}
