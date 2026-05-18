/**
 * 自定义选项渲染：在用户选项中展示头像与姓名。
 */
import { Avatar } from "antd";
import type { UserOption } from "./config";

export function renderUserOption(option: UserOption) {
  const user = option.raw;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {user?.avatar && (
        <Avatar src={user.avatar} style={{ marginInlineEnd: 8 }} />
      )}
      {user?.name ?? option.label}
    </div>
  );
}
