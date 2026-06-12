/**
 * History Clipboard — 根组件
 * @version 1.1
 * @date 2026-06-12
 * @description 基于 URL hash 的路由 + Ant Design 主题注入 + i18n 语言切换
 *
 * 修订记录：
 *   v1.1  2026-06-12  WorkBuddy  接入 i18n：语言同步、antd locale 切换、hash 路由动态监听
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useSettingsStore } from './stores/settingsStore';
import i18n from './i18n';
import QuickPick from './pages/QuickPick';
import MainWindow from './pages/MainWindow';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const { theme: appTheme, accentColor, fontSize, language, loadFromElectron } = useSettingsStore();
  const [route, setRoute] = useState(() => getRoute());

  function getRoute() {
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/quickpick')) return 'quickpick';
    if (hash.startsWith('#/settings')) return 'settings';
    return 'main';
  }

  // 加载设置（含语言偏好）
  useEffect(() => { loadFromElectron(); }, []);

  // 暗色主题：设置 data-theme 属性到 <html>，供 CSS 选择器使用
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  // i18n 语言同步：settingsStore.language 变化时切换 i18next 语言
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // hash 路由动态监听（支持托盘菜单 navigate 推送）
  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
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
    <ConfigProvider locale={language === 'en' ? enUS : zhCN} theme={themeConfig}>
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
