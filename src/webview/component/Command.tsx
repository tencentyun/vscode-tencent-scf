import * as React from "react";
import { Fetcher, StateBooleanFetcherProperty, Types } from "../../types";
import { Element, dispatch } from "../util";
import AsyncButton from "./AsyncButton";
import { Consumer } from "../context";

export interface Props {
  children: string;
}

export default class Command extends React.PureComponent<Props> {
  render() {
    this.context;
    const { children: cmd } = this.props;
    return (
      <span className="cmd">
        {cmd}{" "}
        <Consumer>
          {ctx => (
            <AsyncButton
              className="xs"
              fetcher={ctx.fetcher}
              onClick={() =>
                dispatch({
                  type: Types.EXECUTE,
                  payload: cmd
                })
              }
            >
              执行
            </AsyncButton>
          )}
        </Consumer>
      </span>
    );
  }
}
