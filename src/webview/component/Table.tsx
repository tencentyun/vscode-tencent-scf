import * as React from "react";

export interface Props {
  children?: string | JSX.Element | JSX.Element[];
}
export default function Table(props: Props) {
  return <ol className="table">{props.children}</ol>;
}
