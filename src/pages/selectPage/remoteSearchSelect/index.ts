/**
 * 模块对外导出入口：组件、类型、示例数据请求与选项渲染函数。
 */
export { RemoteSearchSelect } from "./RemoteSearchSelect";
export { fetchUserOptions } from "./config";
export { renderUserOption } from "./renderOption";
export type { RemoteSearchSelectProps } from "./RemoteSearchSelect";
export type {
  LoadMode,
  RemoteSearchFetchParams,
  RemoteSearchFetchResult,
  RemoteSearchFetcher,
  RemoteSearchLabeledValue,
  RemoteSearchOption,
  RemoteSearchValue,
  SelectMode,
} from "./types";
