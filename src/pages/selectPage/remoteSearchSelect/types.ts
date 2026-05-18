import type { ReactNode } from "react";

export type SelectMode = "single" | "multiple";
export type LoadMode = "pagination" | "infinite";

export type RemoteSearchOption<Raw = unknown> = {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
  raw?: Raw;
};

export type RemoteSearchValue =
  | {
      label: ReactNode;
      value: string | number;
    }
  | {
      label: ReactNode;
      value: string | number;
    }[]
  | undefined;

export type RemoteSearchFetchParams = {
  searchText: string;
  page: number;
  limit: number;
};

export type RemoteSearchFetchResult<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> = {
  options: OptionType[];
  hasMore?: boolean;
  total?: number;
};

export type RemoteSearchFetcher<
  OptionType extends RemoteSearchOption = RemoteSearchOption,
> = (
  params: RemoteSearchFetchParams,
) => Promise<RemoteSearchFetchResult<OptionType>>;
