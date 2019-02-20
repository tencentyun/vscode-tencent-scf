import * as React from "react";
import { Fetcher } from "../../types";
import { Element } from "../util";

export interface Props<T> {
  fetcher: Fetcher<T>;
  onClick: () => any;
  children: Element;
  className?: string;
}
export default class AsyncButton<T> extends React.PureComponent<Props<T>> {
  render() {
    const { fetcher, onClick, children, className } = this.props;
    return (
      <button
        className={className}
        disabled={fetcher && fetcher.loading}
        onClick={() => {
          if (fetcher && fetcher.loading) {
            return;
          }
          onClick();
        }}
      >
        {children}
      </button>
    );
  }
}
