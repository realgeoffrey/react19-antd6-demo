export function mergeRemoteOptions<OptionType>(
  previousOptions: OptionType[],
  nextOptions: OptionType[],
  append: boolean,
) {
  return append ? [...previousOptions, ...nextOptions] : nextOptions;
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
