/**
 * 远程搜索状态辅助函数：合并选项列表、解析分页总数与是否还有更多数据。
 */
import type { RemoteSearchFetchResult, RemoteSearchOption } from "./types";

export type RemoteSearchStatus = "idle" | "loading" | "loadingMore";

export type RemoteSearchInternalState<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> = {
  currentPageSize: number;
  hasMore: boolean;
  inputFocused: boolean;
  open: boolean;
  options: OptionType[];
  page: number;
  searchText: string;
  status: RemoteSearchStatus;
  total: number;
};

export type RemoteSearchAction<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> =
  | { type: "clear" }
  | { type: "focusChanged"; inputFocused: boolean }
  | { type: "openChanged"; open: boolean }
  | { type: "requestFailed"; append: boolean }
  | { type: "requestStarted"; append: boolean }
  | {
      type: "requestSucceeded";
      append: boolean;
      page: number;
      pageSize: number;
      result: RemoteSearchFetchResult<OptionType>;
    }
  | { type: "searchChanged"; searchText: string };

export function createRemoteSearchState<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
>(pageSize: number): RemoteSearchInternalState<OptionType> {
  return {
    currentPageSize: pageSize,
    hasMore: false,
    inputFocused: false,
    open: false,
    options: [],
    page: 1,
    searchText: "",
    status: "idle",
    total: 0,
  };
}

export function reduceRemoteSearchState<OptionType extends RemoteSearchOption>(
  state: RemoteSearchInternalState<OptionType>,
  action: RemoteSearchAction<OptionType>,
): RemoteSearchInternalState<OptionType> {
  switch (action.type) {
    case "clear":
      return {
        ...state,
        hasMore: false,
        open: false,
        options: [],
        page: 1,
        searchText: "",
        status: "idle",
        total: 0,
      };

    case "focusChanged":
      return {
        ...state,
        inputFocused: action.inputFocused,
      };

    case "openChanged":
      return {
        ...state,
        open: action.open,
      };

    case "requestFailed":
      return {
        ...state,
        hasMore: false,
        options: action.append ? state.options : [],
        status: "idle",
        total: 0,
      };

    case "requestStarted":
      return action.append
        ? {
            ...state,
            status: "loadingMore",
          }
        : {
            ...state,
            hasMore: false,
            options: [],
            status: "loading",
            total: 0,
          };

    case "requestSucceeded":
      return {
        ...state,
        currentPageSize: action.pageSize,
        hasMore: getHasMore(
          action.result.options.length,
          action.pageSize,
          action.result.hasMore,
        ),
        options: mergeRemoteOptions(
          state.options,
          action.result.options,
          action.append,
        ),
        page: action.page,
        status: "idle",
        total: getPaginationTotal(
          action.result.total,
          action.page,
          action.pageSize,
          action.result.options.length,
        ),
      };

    case "searchChanged":
      return {
        ...state,
        searchText: action.searchText,
      };
  }
}

export function mergeRemoteOptions<OptionType>(
  previousOptions: OptionType[],
  nextOptions: OptionType[],
  append: boolean,
) {
  return append ? [...previousOptions, ...nextOptions] : nextOptions;
}

export function getClearedRemoteSearchState<OptionType = never>() {
  return {
    hasMore: false,
    open: false,
    options: [] as OptionType[],
    page: 1,
    searchText: "",
    total: 0,
  };
}

export function shouldSkipClearSearchRequest(
  searchText: string,
  skipClearSearchRequest: boolean,
) {
  return skipClearSearchRequest && searchText === "";
}

/** 滚动接近底部时触发无限滚动加载 */
export function isNearScrollBottom(target: HTMLElement, threshold: number) {
  return (
    target.scrollTop + target.offsetHeight >= target.scrollHeight - threshold
  );
}

export function getMinimumNotFoundContentHeight(
  optionHeight: number,
  minOptionCount: number,
) {
  return optionHeight * minOptionCount;
}

export function getPaginationRequestPage(
  nextPage: number,
  nextPageSize: number,
  currentPageSize: number,
) {
  return nextPageSize === currentPageSize ? nextPage : 1;
}

export function getRemoteSearchShowSearchConfig(searchValue: string) {
  return {
    autoClearSearchValue: false,
    filterOption: false,
    searchValue,
  };
}

export function shouldAllowPaginationPopupMouseDown(
  target: EventTarget | null,
) {
  const closest = (target as { closest?: unknown } | null)?.closest;

  if (typeof closest !== "function") {
    return false;
  }

  return Boolean(closest.call(target, ".ant-pagination-options"));
}

export function getHasMore(
  resultLength: number,
  limit: number,
  explicitHasMore?: boolean,
) {
  if (explicitHasMore !== undefined) {
    return explicitHasMore;
  }

  return resultLength === limit;
}

export function getTotalFromHeaders(headers: Headers) {
  const total = headers.get("x-total-count");

  if (total === null) {
    return undefined;
  }

  const parsedTotal = Number(total);

  return Number.isFinite(parsedTotal) ? parsedTotal : undefined;
}

export function getPaginationTotal(
  totalFromApi: number | undefined,
  page: number,
  limit: number,
  resultLength: number,
) {
  if (totalFromApi !== undefined) {
    return totalFromApi;
  }

  const loadedTotal = (page - 1) * limit + resultLength;

  return resultLength === limit ? loadedTotal + 1 : loadedTotal;
}
