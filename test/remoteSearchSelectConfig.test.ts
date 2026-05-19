import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserSearchUrl,
  getUserSearchTotal,
  mapUsersToOptions,
} from "../src/pages/selectPage/remoteSearchSelect/config.ts";

test("buildUserSearchUrl includes search, page, and limit params", () => {
  const url = buildUserSearchUrl("alice bob", 2, 10);

  assert.equal(
    url,
    "https://61273138c2e8920017bc0b3c.mockapi.io/api/users?search=alice+bob&page=2&limit=10",
  );
});

test("mapUsersToOptions maps data-array responses and ignores invalid responses", () => {
  assert.deepEqual(
    mapUsersToOptions({
      data: [
        { id: "1", name: "Alice", avatar: "https://example.com/a.png" },
      ],
      total: 100,
    }),
    [
      {
        label: "Alice",
        value: "1",
        raw: {
          id: "1",
          name: "Alice",
          avatar: "https://example.com/a.png",
        },
      },
    ],
  );

  assert.deepEqual(mapUsersToOptions({ message: "not found" }), []);
});

test("getUserSearchTotal reads numeric total from response body", () => {
  assert.equal(getUserSearchTotal({ data: [], total: 100 }), 100);
  assert.equal(getUserSearchTotal({ data: [], total: "100" }), undefined);
  assert.equal(getUserSearchTotal({ data: [] }), undefined);
});
