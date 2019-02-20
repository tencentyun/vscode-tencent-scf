import * as React from "react";
import { Element } from "../util";

export interface Props {
  label: string;
  value?: Element | Element[];
  children?: Element | Element[];
}
export default function Row(props: Props) {
  const { label, value, children } = props;
  return (
    <li className="row">
      <span className="col-label">{label}</span>
      <span className="col-value">{children || value}</span>
    </li>
  );
}
