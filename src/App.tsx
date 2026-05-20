import { ConfigProvider } from 'antd'
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import DemoPage from './pages/demo'
import SelectPage from './pages/selectPage'
import './App.css'

const navItems = [
  { path: "/demo", label: "Demo" },
  { path: "/select", label: "Select Demo" },
];

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <HashRouter>
        <div className="app-shell">
          <nav className="app-nav">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Routes>
            <Route path="/" element={<Navigate to="/demo" replace />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/select" element={<SelectPage />} />
          </Routes>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App
