/**
 * 远程搜索状态辅助函数：合并选项列表、解析分页总数与是否还有更多数据。
 */
export function mergeRemoteOptions<OptionType>(
  previousOptions: OptionType[],
  nextOptions: OptionType[],
  append: boolean,
) {
  return append ? [...previousOptions, ...nextOptions] : nextOptions;
}

export function getRemoteSearchShowSearchConfig(
  searchValue: string,
) {
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
