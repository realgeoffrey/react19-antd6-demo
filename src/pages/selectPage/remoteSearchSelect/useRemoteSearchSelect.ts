/**
 * 远程搜索列表状态与请求逻辑：
 * - 防抖搜索
 * - fetchRef 丢弃过期响应（请求时序）
 * - 翻页 / 无限滚动共用 loadOptions
 * - 清空时重置内部搜索态并跳过紧随其后的空搜索请求
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  REMOTE_SEARCH_DEFAULT_DEBOUNCE_MS,
  REMOTE_SEARCH_DEFAULT_PAGE_SIZE,
  REMOTE_SEARCH_LOAD_MORE_THRESHOLD,
} from "./constants";
import {
  createRemoteSearchState,
  getPaginationRequestPage,
  isNearScrollBottom,
  reduceRemoteSearchState,
  shouldSkipClearSearchRequest,
} from "./state";
import type { RemoteSearchFetcher, RemoteSearchOption } from "./types";

type UseRemoteSearchSelectOptions<OptionType extends RemoteSearchOption> = {
  debounceTimeout?: number;
  fetchOptions: RemoteSearchFetcher<OptionType>;
  onClear?: () => void;
  pageSize?: number;
};

export function useRemoteSearchSelect<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
>({
  debounceTimeout = REMOTE_SEARCH_DEFAULT_DEBOUNCE_MS,
  fetchOptions,
  onClear,
  pageSize = REMOTE_SEARCH_DEFAULT_PAGE_SIZE,
}: UseRemoteSearchSelectOptions<OptionType>) {
  const [state, dispatch] = useReducer(
    reduceRemoteSearchState<OptionType>,
    pageSize,
    createRemoteSearchState<OptionType>,
  );

  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const fetchRef = useRef(0);
  const searchTimerRef = useRef<number | undefined>(undefined);
  const skipClearSearchRequestRef = useRef(false);
  const fetching = state.status === "loading";
  const loadingMore = state.status === "loadingMore";

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current !== undefined) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = undefined;
    }
  }, []);

  const abortInFlightRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = undefined;
  }, []);

  const loadOptions = useCallback(
    (
      nextSearchText: string,
      nextPage: number,
      nextPageSize: number,
      append: boolean,
    ) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      abortInFlightRequest();
      const controller = new AbortController();

      abortControllerRef.current = controller;
      dispatch({ type: "requestStarted", append });

      fetchOptions({
        signal: controller.signal,
        searchText: nextSearchText,
        page: nextPage,
        limit: nextPageSize,
      })
        .then((result) => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          dispatch({
            type: "requestSucceeded",
            append,
            page: nextPage,
            pageSize: nextPageSize,
            result,
          });
        })
        .catch(() => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          dispatch({ type: "requestFailed", append });
        })
        .finally(() => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          abortControllerRef.current = undefined;
        });
    },
    [abortInFlightRequest, fetchOptions],
  );

  const handleSearch = useCallback(
    (value: string) => {
      dispatch({ type: "searchChanged", searchText: value });

      if (
        shouldSkipClearSearchRequest(value, skipClearSearchRequestRef.current)
      ) {
        skipClearSearchRequestRef.current = false;
        return;
      }

      skipClearSearchRequestRef.current = false;
      clearSearchTimer();

      searchTimerRef.current = window.setTimeout(() => {
        loadOptions(value, 1, state.currentPageSize, false);
      }, debounceTimeout);
    },
    [clearSearchTimer, debounceTimeout, loadOptions, state.currentPageSize],
  );

  const handleClear = useCallback(() => {
    clearSearchTimer();
    fetchRef.current += 1;
    abortInFlightRequest();
    skipClearSearchRequestRef.current = true;
    dispatch({ type: "clear" });
    onClear?.();
  }, [abortInFlightRequest, clearSearchTimer, onClear]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      dispatch({ type: "openChanged", open: nextOpen });

      if (
        nextOpen &&
        state.options.length === 0 &&
        state.status !== "loading"
      ) {
        loadOptions(state.searchText, 1, state.currentPageSize, false);
      }
    },
    [
      loadOptions,
      state.currentPageSize,
      state.options.length,
      state.searchText,
      state.status,
    ],
  );

  const handlePaginationChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      loadOptions(
        state.searchText,
        getPaginationRequestPage(nextPage, nextPageSize, state.currentPageSize),
        nextPageSize,
        false,
      );
    },
    [loadOptions, state.currentPageSize, state.searchText],
  );

  const handlePopupScroll = useCallback(
    (target: HTMLDivElement) => {
      if (
        isNearScrollBottom(target, REMOTE_SEARCH_LOAD_MORE_THRESHOLD) &&
        state.hasMore &&
        !fetching &&
        !loadingMore
      ) {
        loadOptions(
          state.searchText,
          state.page + 1,
          state.currentPageSize,
          true,
        );
      }
    },
    [
      fetching,
      loadOptions,
      loadingMore,
      state.currentPageSize,
      state.hasMore,
      state.page,
      state.searchText,
    ],
  );

  const setInputFocused = useCallback((inputFocused: boolean) => {
    dispatch({ type: "focusChanged", inputFocused });
  }, []);

  useEffect(
    () => () => {
      clearSearchTimer();
      fetchRef.current += 1;
      abortInFlightRequest();
    },
    [abortInFlightRequest, clearSearchTimer],
  );

  return {
    currentPageSize: state.currentPageSize,
    fetching,
    handleClear,
    handleOpenChange,
    handlePaginationChange,
    handlePopupScroll,
    handleSearch,
    inputFocused: state.inputFocused,
    loadingMore,
    open: state.open,
    options: state.options,
    page: state.page,
    searchText: state.searchText,
    total: state.total,
    setInputFocused,
  };
}
