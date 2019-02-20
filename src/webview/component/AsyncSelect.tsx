import * as React from "react";
import Select, { Props as BaseProps, Item } from "./Select";
import { Fetcher } from "../../types";

interface Props<T> extends Pick<BaseProps, Exclude<keyof BaseProps, "list">> {
  fetcher: Fetcher<T[]>;
  toItem: (d: T) => Item;
  emptyText?: string
}
export default class AsyncSelect<T> extends React.PureComponent<Props<T>> {
  render() {
    const { fetcher, toItem, emptyText = '没有可选项', ...rest } = this.props;
    let list: Item[];
    if (fetcher.loading) {
      list = [
        {
          text: "加载中...",
          value: ''
        }
      ];
    } else if (fetcher.error) {
      list = [
        {
          text: "加载失败",
          value: ''
        }
      ];
    } else if (!fetcher.data || !fetcher.data.length) {
      list = [
        {
          text: emptyText,
          value: ''
        }
      ];
    } else {
      list = fetcher.data.map(toItem);
    }
    return <Select list={list} {...rest} />;
  }
}
