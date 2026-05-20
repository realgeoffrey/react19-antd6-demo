/**
 * 远程搜索 Select：单选/多选、翻页/无限滚动、防抖、请求时序、加载态。
 * 状态与请求逻辑见 useRemoteSearchSelect，UI 片段见 RemoteSearchSelectView。
 */
import type { FocusEvent, ReactElement, ReactNode, UIEvent } from "react";
import { useCallback, useMemo } from "react";
import type { SelectProps } from "antd";
import { Select } from "antd";
import {
  LOADING_MORE_OPTION_VALUE,
  REMOTE_SEARCH_DEFAULT_DEBOUNCE_MS,
  REMOTE_SEARCH_DEFAULT_PAGE_SIZE,
} from "./constants";
import {
  RemoteSearchNotFound,
  RemoteSearchPaginationPopup,
} from "./RemoteSearchSelectView";
import { renderRemoteSearchOption } from "./renderRemoteSearchOption";
import {
  getRemoteSearchDisplaySearchValue,
  getRemoteSearchShowSearchConfig,
} from "./state";
import type {
  LoadMode,
  RemoteSearchFetcher,
  RemoteSearchOption,
  RemoteSearchValue,
  SelectMode,
} from "./types";
import { useRemoteSearchSelect } from "./useRemoteSearchSelect";

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
  selectionMode?: SelectMode;
  selectMode?: SelectMode;
};

export function RemoteSearchSelect<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
>({
  allowClear = false,
  debounceTimeout = REMOTE_SEARCH_DEFAULT_DEBOUNCE_MS,
  fetchOptions,
  loadMode = "pagination",
  loadingOptionLabel = "Loading more...",
  pageSize = REMOTE_SEARCH_DEFAULT_PAGE_SIZE,
  popupStyle,
  renderOption,
  selectionMode,
  selectMode,
  onBlur,
  onClear,
  onFocus,
  ...props
}: RemoteSearchSelectProps<OptionType>) {
  const {
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
  } = useRemoteSearchSelect<OptionType>({
    debounceTimeout,
    fetchOptions,
    onClear,
    pageSize,
  });

  const isInfinite = loadMode === "infinite";
  const resolvedSelectionMode = selectionMode ?? selectMode ?? "multiple";

  const showSearchConfig = useMemo(
    () => ({
      ...getRemoteSearchShowSearchConfig(
        getRemoteSearchDisplaySearchValue(searchText, inputFocused, open),
      ),
      onSearch: handleSearch,
    }),
    [handleSearch, inputFocused, open, searchText],
  );

  const popupRender = useMemo(() => {
    if (loadMode !== "pagination") {
      return undefined;
    }

    return (menu: ReactElement) => (
      <RemoteSearchPaginationPopup
        menu={menu}
        footerProps={{
          currentPageSize,
          page,
          total,
          onChange: handlePaginationChange,
        }}
      />
    );
  }, [currentPageSize, handlePaginationChange, loadMode, page, total]);

  const selectOptions = useMemo(() => {
    if (!isInfinite || !loadingMore) {
      return options;
    }

    return [
      ...options,
      {
        label: loadingOptionLabel,
        value: LOADING_MORE_OPTION_VALUE,
        disabled: true,
      } as OptionType,
    ];
  }, [isInfinite, loadingMore, loadingOptionLabel, options]);

  const onPopupScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      handlePopupScroll(event.currentTarget);
    },
    [handlePopupScroll],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      setInputFocused(true);
      onFocus?.(event);
    },
    [onFocus, setInputFocused],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      setInputFocused(false);
      onBlur?.(event);
    },
    [onBlur, setInputFocused],
  );

  return (
    <Select<RemoteSearchValue, OptionType>
      {...props}
      allowClear={allowClear}
      labelInValue
      loading={fetching}
      mode={resolvedSelectionMode === "multiple" ? "multiple" : undefined}
      notFoundContent={<RemoteSearchNotFound fetching={fetching} />}
      onBlur={handleBlur}
      onClear={handleClear}
      onFocus={handleFocus}
      onOpenChange={handleOpenChange}
      onPopupScroll={isInfinite ? onPopupScroll : undefined}
      open={open}
      options={selectOptions}
      optionRender={(option) =>
        renderRemoteSearchOption({ option, renderOption })
      }
      popupRender={popupRender}
      popupStyle={popupStyle}
      showSearch={showSearchConfig}
    />
  );
}
