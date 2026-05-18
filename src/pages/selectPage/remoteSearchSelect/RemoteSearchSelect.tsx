import type { ReactElement, ReactNode, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SelectProps } from "antd";
import { Pagination, Select, Space, Spin } from "antd";
import {
  getHasMore,
  getPaginationTotal,
  mergeRemoteOptions,
} from "./state";
import type {
  LoadMode,
  RemoteSearchFetcher,
  RemoteSearchOption,
  RemoteSearchValue,
  SelectMode,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DEBOUNCE_TIMEOUT = 300;
const LOAD_MORE_THRESHOLD = 24;
const LOADING_OPTION_VALUE = "__remote_search_loading_more__";

export type RemoteSearchSelectProps<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> = Omit<
  SelectProps<RemoteSearchValue, OptionType>,
  | "children"
  | "labelInValue"
  | "mode"
  | "notFoundContent"
  | "onOpenChange"
  | "onPopupScroll"
  | "options"
  | "popupRender"
  | "showSearch"
> & {
  debounceTimeout?: number;
  fetchOptions: RemoteSearchFetcher<OptionType>;
  loadMode?: LoadMode;
  loadingOptionLabel?: ReactNode;
  pageSize?: number;
  renderOption?: (option: OptionType) => ReactNode;
  selectMode?: SelectMode;
};

export function RemoteSearchSelect<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
>({
  debounceTimeout = DEFAULT_DEBOUNCE_TIMEOUT,
  fetchOptions,
  loadMode = "pagination",
  loadingOptionLabel = "Loading more...",
  pageSize = DEFAULT_PAGE_SIZE,
  renderOption,
  selectMode = "multiple",
  ...props
}: RemoteSearchSelectProps<OptionType>) {
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [searchText, setSearchText] = useState("");
  const [total, setTotal] = useState(0);
  const fetchRef = useRef(0);
  const searchTimerRef = useRef<number | undefined>(undefined);

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
      if (searchTimerRef.current !== undefined) {
        window.clearTimeout(searchTimerRef.current);
      }

      searchTimerRef.current = window.setTimeout(() => {
        setSearchText(value);
        loadOptions(value, 1, currentPageSize, false);
      }, debounceTimeout);
    },
    [currentPageSize, debounceTimeout, loadOptions],
  );

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

  const handlePopupScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollTop + target.offsetHeight >=
      target.scrollHeight - LOAD_MORE_THRESHOLD;

    if (isNearBottom && hasMore && !fetching && !loadingMore) {
      loadOptions(searchText, page + 1, currentPageSize, true);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && options.length === 0 && !fetching) {
      loadOptions(searchText, 1, currentPageSize, false);
    }
  };

  const handlePaginationChange = (
    nextPage: number,
    nextPageSize: number,
  ) => {
    loadOptions(searchText, nextPage, nextPageSize, false);
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
      labelInValue
      loading={fetching}
      mode={selectMode === "multiple" ? "multiple" : undefined}
      onOpenChange={handleOpenChange}
      onPopupScroll={
        loadMode === "infinite" ? handlePopupScroll : undefined
      }
      popupRender={popupRender}
      showSearch={{ filterOption: false, onSearch: handleSearch }}
      notFoundContent={fetching ? <Spin size="small" /> : "No results found"}
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
