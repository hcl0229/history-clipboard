/**
 * History Clipboard — 根组件
 * @version 1.0
 * @date 2026-06-10
 * @description 基于 URL hash 的简单路由 + Ant Design 主题注入
 */

import React, { useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useSettingsStore } from './stores/settingsStore';
import QuickPick from './pages/QuickPick';
import MainWindow from './pages/MainWindow';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const { theme: appTheme, accentColor, fontSize, loadFromElectron } = useSettingsStore();

  useEffect(() => {
    loadFromElectron();
  }, []);

  // 简单 hash 路由
  const route = useMemo(() => {
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/quickpick')) return 'quickpick';
    if (hash.startsWith('#/settings')) return 'settings';
    return 'main';
  }, []);

  const themeConfig = useMemo(
    () => ({
      algorithm: appTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      token: {
        colorPrimary: accentColor,
        fontSize: parseInt(fontSize, 10),
        borderRadius: 6,
      },
    }),
    [appTheme, accentColor, fontSize],
  );

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      {route === 'quickpick' ? (
        <QuickPick />
      ) : route === 'settings' ? (
        <Settings />
      ) : (
        <MainWindow />
      )}
    </ConfigProvider>
  );
};

export default App;
