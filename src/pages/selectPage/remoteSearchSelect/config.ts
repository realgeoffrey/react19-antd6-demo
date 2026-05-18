import type {
  RemoteSearchFetchParams,
  RemoteSearchFetchResult,
  RemoteSearchOption,
} from "./types.ts";
import { getTotalFromHeaders } from "./state.ts";

export const USER_SEARCH_API =
  "https://660d2bd96ddfa2943b33731c.mockapi.io/api/users/";

export type RemoteUser = {
  id?: string | number;
  name?: string;
  avatar?: string;
};

export type UserOption = RemoteSearchOption<RemoteUser>;

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
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((user: RemoteUser) => ({
    label: user.name ?? "",
    value: String(user.id ?? ""),
    raw: user,
  }));
}

export async function fetchUserOptions({
  searchText,
  page,
  limit,
}: RemoteSearchFetchParams): Promise<RemoteSearchFetchResult<UserOption>> {
  try {
    const response = await fetch(buildUserSearchUrl(searchText, page, limit));
    const data: unknown = await response.json();

    return {
      options: mapUsersToOptions(data),
      total: getTotalFromHeaders(response.headers),
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
