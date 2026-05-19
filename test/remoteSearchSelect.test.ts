import assert from "node:assert/strict";
import test from "node:test";

import {
  getHasMore,
  getPaginationTotal,
  getRemoteSearchShowSearchConfig,
  getTotalFromHeaders,
  mergeRemoteOptions,
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
