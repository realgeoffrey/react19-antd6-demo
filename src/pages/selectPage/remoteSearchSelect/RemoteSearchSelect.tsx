/**
 * 远程搜索 Select 组件：支持防抖搜索、分页与无限滚动两种加载模式。
 */
import type { FocusEvent, ReactElement, ReactNode, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SelectProps } from "antd";
import { Pagination, Select, Space, Spin } from "antd";
import {
  getClearedRemoteSearchState,
  getHasMore,
  getMinimumNotFoundContentHeight,
  getPaginationRequestPage,
  getPaginationTotal,
  getRemoteSearchShowSearchConfig,
  mergeRemoteOptions,
  shouldSkipClearSearchRequest,
  shouldAllowPaginationPopupMouseDown,
} from "./state";
import type {
  LoadMode,
  RemoteSearchFetcher,
  RemoteSearchOption,
  RemoteSearchValue,
  SelectMode,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DEBOUNCE_TIMEOUT = 500;
const LOAD_MORE_THRESHOLD = 24;
const LOADING_OPTION_VALUE = "__remote_search_loading_more__";
const OPTION_HEIGHT = 32;
const MIN_NOT_FOUND_OPTION_COUNT = 4;

export type RemoteSearchSelectProps<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> = Omit<
  SelectProps<RemoteSearchValue, OptionType>,
  | "allowClear"
  | "children"
  | "labelInValue"
  | "mode"
  | "notFoundContent"
  | "onOpenChange"
  | "onPopupScroll"
  | "onClear"
  | "open"
  | "options"
  | "popupRender"
  | "showSearch"
> & {
  allowClear?: SelectProps<RemoteSearchValue, OptionType>["allowClear"];
  debounceTimeout?: number;
  fetchOptions: RemoteSearchFetcher<OptionType>;
  loadMode?: LoadMode;
  loadingOptionLabel?: ReactNode;
  onClear?: SelectProps<RemoteSearchValue, OptionType>["onClear"];
  pageSize?: number;
  renderOption?: (option: OptionType) => ReactNode;
  selectMode?: SelectMode;
};

export function RemoteSearchSelect<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
>({
  allowClear = false,
  debounceTimeout = DEFAULT_DEBOUNCE_TIMEOUT,
  fetchOptions,
  loadMode = "pagination",
  loadingOptionLabel = "Loading more...",
  pageSize = DEFAULT_PAGE_SIZE,
  popupStyle,
  renderOption,
  selectMode = "multiple",
  onBlur,
  onClear,
  onFocus,
  ...props
}: RemoteSearchSelectProps<OptionType>) {
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
            getHasMore(
              result.options.length,
              nextPageSize,
              result.hasMore,
            ),
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
        shouldSkipClearSearchRequest(
          value,
          skipClearSearchRequestRef.current,
        )
      ) {
        skipClearSearchRequestRef.current = false;
        return;
      }

      skipClearSearchRequestRef.current = false;

      if (searchTimerRef.current !== undefined) {
        window.clearTimeout(searchTimerRef.current);
      }

      searchTimerRef.current = window.setTimeout(() => {
        loadOptions(value, 1, currentPageSize, false);
      }, debounceTimeout);
    },
    [currentPageSize, debounceTimeout, loadOptions],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      setInputFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      setInputFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleClear = useCallback(() => {
    if (searchTimerRef.current !== undefined) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = undefined;
    }

    fetchRef.current += 1;
    skipClearSearchRequestRef.current = true;

    const clearedState = getClearedRemoteSearchState<OptionType>();

    setFetching(false);
    setLoadingMore(false);
    setOpen(clearedState.open);
    setOptions(clearedState.options);
    setHasMore(clearedState.hasMore);
    setPage(clearedState.page);
    setSearchText(clearedState.searchText);
    setTotal(clearedState.total);
    onClear?.();
  }, [onClear]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== undefined) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const mergedOptions = useMemo(() => {
    if (!loadingMore) {
      return options;
    }

    return [
      ...options,
      {
        label: loadingOptionLabel,
        value: LOADING_OPTION_VALUE,
        disabled: true,
      } as OptionType,
    ];
  }, [loadingMore, loadingOptionLabel, options]);

  const showSearchConfig = useMemo(
    () => ({
      ...getRemoteSearchShowSearchConfig(inputFocused ? searchText : ""),
      onSearch: handleSearch,
    }),
    [handleSearch, inputFocused, searchText],
  );

  const notFoundContent = (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: getMinimumNotFoundContentHeight(
          OPTION_HEIGHT,
          MIN_NOT_FOUND_OPTION_COUNT,
        ),
      }}
    >
      {fetching ? <Spin size="small" /> : "No results found"}
    </div>
  );

  const handlePopupScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollTop + target.offsetHeight >=
      target.scrollHeight - LOAD_MORE_THRESHOLD;

    if (isNearBottom && hasMore && !fetching && !loadingMore) {
      loadOptions(searchText, page + 1, currentPageSize, true);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen && options.length === 0 && !fetching) {
      loadOptions(searchText, 1, currentPageSize, false);
    }
  };

  const handlePaginationChange = (
    nextPage: number,
    nextPageSize: number,
  ) => {
    loadOptions(
      searchText,
      getPaginationRequestPage(nextPage, nextPageSize, currentPageSize),
      nextPageSize,
      false,
    );
  };

  const popupRender = (menu: ReactElement) => {
    if (loadMode !== "pagination") {
      return menu;
    }

    return (
      <div>
        {menu}
        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            padding: "8px",
          }}
          onMouseDown={(event) => {
            if (shouldAllowPaginationPopupMouseDown(event.target)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Pagination
            size="small"
            current={page}
            pageSize={currentPageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(totalCount) => `Total ${totalCount} items`}
            onChange={handlePaginationChange}
          />
        </div>
      </div>
    );
  };

  return (
    <Select<RemoteSearchValue, OptionType>
      {...props}
      allowClear={allowClear}
      labelInValue
      loading={fetching}
      mode={selectMode === "multiple" ? "multiple" : undefined}
      onClear={handleClear}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onOpenChange={handleOpenChange}
      onPopupScroll={
        loadMode === "infinite" ? handlePopupScroll : undefined
      }
      open={open}
      popupStyle={
        open
          ? popupStyle
          : {
              ...popupStyle,
              display: "none",
            }
      }
      popupRender={popupRender}
      showSearch={showSearchConfig}
      notFoundContent={notFoundContent}
      options={loadMode === "infinite" ? mergedOptions : options}
      optionRender={(option) => {
        if (option.data.value === LOADING_OPTION_VALUE) {
          return (
            <Space size={8}>
              <Spin size="small" />
              {option.data.label}
            </Space>
          );
        }

        return renderOption
          ? renderOption(option.data)
          : option.data.label;
      }}
    />
  );
}
