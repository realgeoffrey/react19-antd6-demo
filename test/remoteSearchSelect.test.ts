import assert from "node:assert/strict";
import test from "node:test";

import {
  getClearedRemoteSearchState,
  getHasMore,
  getMinimumNotFoundContentHeight,
  getPaginationRequestPage,
  getPaginationTotal,
  getRemoteSearchShowSearchConfig,
  getTotalFromHeaders,
  mergeRemoteOptions,
  shouldSkipClearSearchRequest,
  shouldAllowPaginationPopupMouseDown,
} from "../src/pages/selectPage/remoteSearchSelect/state.ts";

const previousOptions = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
];

const nextOptions = [{ label: "Cindy", value: "3" }];

test("mergeRemoteOptions appends options for infinite loading", () => {
  assert.deepEqual(mergeRemoteOptions(previousOptions, nextOptions, true), [
    ...previousOptions,
    ...nextOptions,
  ]);
});

test("mergeRemoteOptions replaces options for pagination loading", () => {
  assert.deepEqual(
    mergeRemoteOptions(previousOptions, nextOptions, false),
    nextOptions,
  );
});

test("getClearedRemoteSearchState clears selected search results and search text state", () => {
  assert.deepEqual(getClearedRemoteSearchState(), {
    hasMore: false,
    open: false,
    options: [],
    page: 1,
    searchText: "",
    total: 0,
  });
});

test("shouldSkipClearSearchRequest skips only the synthetic empty search after clear", () => {
  assert.equal(shouldSkipClearSearchRequest("", true), true);
  assert.equal(shouldSkipClearSearchRequest("Alice", true), false);
  assert.equal(shouldSkipClearSearchRequest("", false), false);
});

test("getPaginationRequestPage starts from page 1 when page size changes", () => {
  assert.equal(getPaginationRequestPage(3, 20, 10), 1);
  assert.equal(getPaginationRequestPage(3, 10, 10), 3);
});

test("getHasMore prefers explicit API value and otherwise checks full page", () => {
  assert.equal(getHasMore(2, 10, true), true);
  assert.equal(getHasMore(10, 10), true);
  assert.equal(getHasMore(9, 10), false);
});

test("getTotalFromHeaders reads x-total-count when it is present", () => {
  const headers = new Headers({ "x-total-count": "85" });

  assert.equal(getTotalFromHeaders(headers), 85);
  assert.equal(getTotalFromHeaders(new Headers()), undefined);
});

test("getPaginationTotal uses API total before fallback total", () => {
  assert.equal(getPaginationTotal(85, 3, 10, 4), 85);
  assert.equal(getPaginationTotal(undefined, 1, 10, 10), 11);
  assert.equal(getPaginationTotal(undefined, 3, 10, 4), 24);
});

test("getRemoteSearchShowSearchConfig keeps displayed input tied to search text", () => {
  assert.deepEqual(getRemoteSearchShowSearchConfig("Alice"), {
    autoClearSearchValue: false,
    filterOption: false,
    searchValue: "Alice",
  });
});

test("shouldAllowPaginationPopupMouseDown lets pagination option controls keep focus", () => {
  const target = {
    closest(selector: string) {
      return selector === ".ant-pagination-options" ? {} : null;
    },
  } as EventTarget;

  assert.equal(shouldAllowPaginationPopupMouseDown(target), true);
  assert.equal(shouldAllowPaginationPopupMouseDown(null), false);
});

test("getMinimumNotFoundContentHeight keeps empty and loading dropdowns at three option rows", () => {
  assert.equal(getMinimumNotFoundContentHeight(32, 3), 96);
});
