import type { ReactNode } from "react";
import { Space, Spin } from "antd";
import { LOADING_MORE_OPTION_VALUE } from "./constants";
import type { RemoteSearchOption } from "./types";

type RenderRemoteSearchOptionParams<OptionType extends RemoteSearchOption> = {
  option: { data: OptionType };
  renderOption?: (option: OptionType) => ReactNode;
};

/** 无限滚动“加载更多”占位项与普通选项的统一渲染 */
export function renderRemoteSearchOption<OptionType extends RemoteSearchOption>({
  option,
  renderOption,
}: RenderRemoteSearchOptionParams<OptionType>) {
  if (option.data.value === LOADING_MORE_OPTION_VALUE) {
    return (
      <Space size={8}>
        <Spin size="small" />
        {option.data.label}
      </Space>
    );
  }

  return renderOption ? renderOption(option.data) : option.data.label;
}
