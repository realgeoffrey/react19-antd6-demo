/**
 * RemoteSearchSelect 的 UI 片段：空态、分页底栏。
 */
import type { ReactElement } from "react";
import { Pagination, Spin } from "antd";
import {
  REMOTE_SEARCH_MIN_NOT_FOUND_ROWS,
  REMOTE_SEARCH_OPTION_HEIGHT,
} from "./constants";
import {
  getMinimumNotFoundContentHeight,
  shouldAllowPaginationPopupMouseDown,
} from "./state";

const notFoundWrapperStyle = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
} as const;

const paginationFooterStyle = {
  borderTop: "1px solid #f0f0f0",
  padding: "8px",
} as const;

type RemoteSearchNotFoundProps = {
  fetching: boolean;
};

/** 空列表 / 首次加载时的占位，高度对齐若干行选项避免下拉抖动 */
export function RemoteSearchNotFound({ fetching }: RemoteSearchNotFoundProps) {
  return (
    <div
      style={{
        ...notFoundWrapperStyle,
        minHeight: getMinimumNotFoundContentHeight(
          REMOTE_SEARCH_OPTION_HEIGHT,
          REMOTE_SEARCH_MIN_NOT_FOUND_ROWS,
        ),
      }}
    >
      {fetching ? <Spin size="small" /> : "No results found"}
    </div>
  );
}

type RemoteSearchPaginationFooterProps = {
  currentPageSize: number;
  page: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
};

/** 翻页模式底栏：阻止 mousedown 冒泡以免 Select 失焦，但放行 pageSize 下拉 */
function RemoteSearchPaginationFooter({
  currentPageSize,
  page,
  total,
  onChange,
}: RemoteSearchPaginationFooterProps) {
  return (
    <div
      style={paginationFooterStyle}
      onMouseDown={(event) => {
        if (shouldAllowPaginationPopupMouseDown(event.target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Pagination
        size="small"
        current={page}
        pageSize={currentPageSize}
        total={total}
        showSizeChanger
        showQuickJumper
        showTotal={(totalCount) => `Total ${totalCount} items`}
        onChange={onChange}
      />
    </div>
  );
}

export function RemoteSearchPaginationPopup({
  footerProps,
  menu,
}: {
  footerProps: RemoteSearchPaginationFooterProps;
  menu: ReactElement;
}) {
  return (
    <div>
      {menu}
      <RemoteSearchPaginationFooter {...footerProps} />
    </div>
  );
}
