import type { ReactNode } from "react";
import { useState } from "react";
import { Card, Segmented, Space, Typography } from "antd";
import {
  fetchUserOptions,
  RemoteSearchSelect,
  renderUserOption,
} from "./remoteSearchSelect";
import type { LoadMode, SelectMode } from "./remoteSearchSelect";

const { Paragraph, Text, Title } = Typography;

type SelectedUserValue = {
  label: ReactNode;
  value: string | number;
};

const selectionModeOptions: { label: string; value: SelectMode }[] = [
  { label: "单选", value: "single" },
  { label: "多选", value: "multiple" },
];

const loadModeOptions: { label: string; value: LoadMode }[] = [
  { label: "翻页", value: "pagination" },
  { label: "无限滚动", value: "infinite" },
];

function getSelectedUsers(
  value: SelectedUserValue | SelectedUserValue[] | undefined,
) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function SelectedUsers({
  value,
}: {
  value: SelectedUserValue | SelectedUserValue[] | undefined;
}) {
  const selectedUsers = getSelectedUsers(value);

  return (
    <Space direction="vertical" size={4}>
      <Text type="secondary">选中值</Text>
      {selectedUsers.length === 0 ? (
        <Text type="secondary">未选择</Text>
      ) : (
        selectedUsers.map((item) => (
          <Text key={item.value}>
            id: {item.value}，name: {String(item.label)}
          </Text>
        ))
      )}
    </Space>
  );
}

export default function SelectPage() {
  const [selectionMode, setSelectionMode] =
    useState<SelectMode>("multiple");
  const [loadMode, setLoadMode] = useState<LoadMode>("pagination");
  const [singleValue, setSingleValue] = useState<SelectedUserValue>();
  const [multipleValue, setMultipleValue] = useState<SelectedUserValue[]>([]);

  const value =
    selectionMode === "multiple" ? multipleValue : singleValue;

  return (
    <main className="demo-page">
      <section className="demo-header">
        <Text type="secondary">Ant Design 6</Text>
        <Title level={1}>selectPage</Title>
        <Paragraph>
          支持：单选或多选，翻页或无限滚动加载展示结果，远程搜索，防抖控制，请求时序控制，加载状态
        </Paragraph>
      </section>

      <Card className="demo-card">
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space wrap>
            <Segmented
              options={selectionModeOptions}
              value={selectionMode}
              onChange={(nextMode) => {
                setSelectionMode(nextMode as SelectMode);
              }}
            />

            <Segmented
              options={loadModeOptions}
              value={loadMode}
              onChange={(nextMode) => {
                setLoadMode(nextMode as LoadMode);
              }}
            />
          </Space>

          <RemoteSearchSelect
            allowClear
            key={`${selectionMode}-${loadMode}`}
            fetchOptions={fetchUserOptions}
            loadMode={loadMode}
            onChange={(newValue) => {
              if (selectionMode === "multiple") {
                setMultipleValue(Array.isArray(newValue) ? newValue : []);
                return;
              }

              setSingleValue(Array.isArray(newValue) ? undefined : newValue);
            }}
            placeholder="Select users"
            renderOption={renderUserOption}
            selectMode={selectionMode}
            style={{ width: "100%" }}
            value={value}
          />

          <SelectedUsers value={value} />
        </Space>
      </Card>
    </main>
  );
}
