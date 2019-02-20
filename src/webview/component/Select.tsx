import * as React from "react";

export interface Item {
  text: string;
  value: string;
}
export interface Props {
  list: Item[];
  selected: string;
  /** 是否自动修正（即如果selected不在列表内，自动修改为列表内第一项） */
  autoFix?: boolean;
  onChange(item: Item | undefined): any;
}

export default class Select extends React.PureComponent<Props> {
  render() {
    const { list, selected, autoFix = false, onChange } = this.props;
    let autoFixSelected: string | undefined = selected;
    if (autoFix && !list.find(item => item.value === selected)) {
      const found = list.length ? list[0] : undefined;
      autoFixSelected = found ? found.value : undefined;
      // 是否触发onChange？
      if (autoFixSelected !== selected) {
        onChange(found);
      }
    }
    return (
      <select
        value={autoFixSelected}
        onChange={e => {
          onChange(list.find(i => i.value === e.target.value));
        }}
      >
        {list.map(item => (
          <option key={item.value}>{item.text}</option>
        ))}
      </select>
    );
  }
}
