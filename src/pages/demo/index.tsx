import { Card, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

export default function DemoPage() {
  return (
    <main className="demo-page">
      <section className="demo-header">
        <Text type="secondary">Ant Design 6</Text>
        <Title level={1}>Demo</Title>
        <Paragraph>最简 demo 页面。</Paragraph>
      </section>

      <Card className="demo-card">demo content</Card>
    </main>
  )
}
