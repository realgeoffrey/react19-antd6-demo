/**
 * 远程搜索列表状态与请求逻辑：
 * - 防抖搜索
 * - fetchRef 丢弃过期响应（请求时序）
 * - 翻页 / 无限滚动共用 loadOptions
 * - 清空时重置内部搜索态并跳过紧随其后的空搜索请求
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  REMOTE_SEARCH_DEFAULT_DEBOUNCE_MS,
  REMOTE_SEARCH_DEFAULT_PAGE_SIZE,
  REMOTE_SEARCH_LOAD_MORE_THRESHOLD,
} from "./constants";
import {
  getClearedRemoteSearchState,
  getHasMore,
  getPaginationRequestPage,
  getPaginationTotal,
  isNearScrollBottom,
  mergeRemoteOptions,
  shouldSkipClearSearchRequest,
} from "./state";
import type {
  RemoteSearchFetcher,
  RemoteSearchOption,
} from "./types";

type UseRemoteSearchSelectOptions<
  OptionType extends RemoteSearchOption,
> = {
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
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [inputFocused, setInputFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [total, setTotal] = useState(0);

  const fetchRef = useRef(0);
  const searchTimerRef = useRef<number | undefined>(undefined);
  const skipClearSearchRequestRef = useRef(false);

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current !== undefined) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = undefined;
    }
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

      if (append) {
        setLoadingMore(true);
      } else {
        setOptions([]);
        setFetching(true);
        setLoadingMore(false);
        setHasMore(false);
        setTotal(0);
      }

      fetchOptions({
        searchText: nextSearchText,
        page: nextPage,
        limit: nextPageSize,
      })
        .then((result) => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          setOptions((previousOptions) =>
            mergeRemoteOptions(previousOptions, result.options, append),
          );
          setPage(nextPage);
          setCurrentPageSize(nextPageSize);
          setHasMore(
            getHasMore(result.options.length, nextPageSize, result.hasMore),
          );
          setTotal(
            getPaginationTotal(
              result.total,
              nextPage,
              nextPageSize,
              result.options.length,
            ),
          );
        })
        .catch(() => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          if (!append) {
            setOptions([]);
          }
          setHasMore(false);
          setTotal(0);
        })
        .finally(() => {
          if (fetchId !== fetchRef.current) {
            return;
          }

          setFetching(false);
          setLoadingMore(false);
        });
    },
    [fetchOptions],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchText(value);

      if (
        shouldSkipClearSearchRequest(value, skipClearSearchRequestRef.current)
      ) {
        skipClearSearchRequestRef.current = false;
        return;
      }

      skipClearSearchRequestRef.current = false;
      clearSearchTimer();

      searchTimerRef.current = window.setTimeout(() => {
        loadOptions(value, 1, currentPageSize, false);
      }, debounceTimeout);
    },
    [clearSearchTimer, currentPageSize, debounceTimeout, loadOptions],
  );

  const handleClear = useCallback(() => {
    clearSearchTimer();
    fetchRef.current += 1;
    skipClearSearchRequestRef.current = true;

    const cleared = getClearedRemoteSearchState<OptionType>();

    setFetching(false);
    setLoadingMore(false);
    setOpen(cleared.open);
    setOptions(cleared.options);
    setHasMore(cleared.hasMore);
    setPage(cleared.page);
    setSearchText(cleared.searchText);
    setTotal(cleared.total);
    onClear?.();
  }, [clearSearchTimer, onClear]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen && options.length === 0 && !fetching) {
        loadOptions(searchText, 1, currentPageSize, false);
      }
    },
    [currentPageSize, fetching, loadOptions, options.length, searchText],
  );

  const handlePaginationChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      loadOptions(
        searchText,
        getPaginationRequestPage(nextPage, nextPageSize, currentPageSize),
        nextPageSize,
        false,
      );
    },
    [currentPageSize, loadOptions, searchText],
  );

  const handlePopupScroll = useCallback(
    (target: HTMLDivElement) => {
      if (
        isNearScrollBottom(target, REMOTE_SEARCH_LOAD_MORE_THRESHOLD) &&
        hasMore &&
        !fetching &&
        !loadingMore
      ) {
        loadOptions(searchText, page + 1, currentPageSize, true);
      }
    },
    [
      currentPageSize,
      fetching,
      hasMore,
      loadOptions,
      loadingMore,
      page,
      searchText,
    ],
  );

  useEffect(() => () => clearSearchTimer(), [clearSearchTimer]);

  return {
    currentPageSize,
    fetching,
    handleClear,
    handleOpenChange,
    handlePaginationChange,
    handlePopupScroll,
    handleSearch,
    inputFocused,
    loadingMore,
    open,
    options,
    page,
    searchText,
    total,
    setInputFocused,
  };
}
