/**
 * 示例配置：搜索 API 地址、请求构建与 fetchUserOptions 数据拉取。
 */
import type {
  RemoteSearchFetchParams,
  RemoteSearchFetchResult,
  RemoteSearchOption,
} from "./types.ts";

export const USER_SEARCH_API =
  "https://61273138c2e8920017bc0b3c.mockapi.io/api/users";

export type RemoteUser = {
  id?: string | number;
  name?: string;
  avatar?: string;
};

export type UserOption = RemoteSearchOption<RemoteUser>;

type UserSearchResponse = {
  data?: unknown;
  total?: unknown;
};

export function buildUserSearchUrl(
  username: string,
  page: number,
  limit: number,
) {
  const params = new URLSearchParams({
    search: username,
    page: String(page),
    limit: String(limit),
  });

  return `${USER_SEARCH_API}?${params.toString()}`;
}

export function mapUsersToOptions(response: unknown): UserOption[] {
  const data = (response as UserSearchResponse | null)?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((user: RemoteUser) => ({
    label: user.name ?? "",
    value: String(user.id ?? ""),
    raw: user,
  }));
}

export function getUserSearchTotal(response: unknown) {
  const total = (response as UserSearchResponse | null)?.total;

  return typeof total === "number" && Number.isFinite(total)
    ? total
    : undefined;
}

export async function fetchUserOptions({
  signal,
  searchText,
  page,
  limit,
}: RemoteSearchFetchParams): Promise<RemoteSearchFetchResult<UserOption>> {
  try {
    const response = await fetch(buildUserSearchUrl(searchText, page, limit), {
      signal,
    });
    const data: unknown = await response.json();

    return {
      options: mapUsersToOptions(data),
      total: getUserSearchTotal(data),
    };
  } catch {
    console.log("fetch mock data failed");

    return {
      options: [],
      hasMore: false,
      total: 0,
    };
  }
}
