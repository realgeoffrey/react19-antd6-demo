import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserSearchUrl,
  mapUsersToOptions,
} from "../src/pages/selectPage/remoteSearchSelect/config.ts";

test("buildUserSearchUrl includes search, page, and limit params", () => {
  const url = buildUserSearchUrl("alice bob", 2, 10);

  assert.equal(
    url,
    "https://660d2bd96ddfa2943b33731c.mockapi.io/api/users/?search=alice+bob&page=2&limit=10",
  );
});

test("mapUsersToOptions maps array responses and ignores non-array responses", () => {
  assert.deepEqual(
    mapUsersToOptions([
      { id: "1", name: "Alice", avatar: "https://example.com/a.png" },
    ]),
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
