/**
 * History Clipboard — 设置面板
 * @version 1.2
 * @date 2026-06-12
 *
 * 修订记录：
 *   v1.2  2026-06-12  WorkBuddy  i18n 接入 + 语言切换控件
 *   v1.1  2026-06-11  WorkBuddy  移除 i18n 语言切换、紧凑 Form 布局
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Select, Slider, Switch, Typography } from 'antd';
import { useSettingsStore } from '../stores/settingsStore';

const { Title } = Typography;

const ACCENTS = [
  { label: 'Blue', value: '#1677FF' },
  { label: 'Cyan', value: '#13C2C2' },
  { label: 'Green', value: '#52C41A' },
  { label: 'Orange', value: '#FA8C16' },
  { label: 'Red', value: '#F5222D' },
  { label: 'Purple', value: '#722ED1' },
  { label: 'Pink', value: '#EB2F96' },
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const store = useSettingsStore();

  useEffect(() => { store.loadFromElectron(); }, []);

  return (
    <div style={{ maxWidth: 380, margin: '0 auto', padding: '16px 20px' }}>
      <Title level={5} style={{ marginBottom: 12 }}>{t('settings.title')}</Title>
      <Form layout="vertical" size="small">
        <Form.Item label={t('settings.theme')} style={{ marginBottom: 10 }}>
          <Select value={store.theme} onChange={store.setTheme} style={{ width: 120 }}
            options={[{ label: t('settings.light'), value: 'light' }, { label: t('settings.dark'), value: 'dark' }]} />
        </Form.Item>
        <Form.Item label={t('settings.accent')} style={{ marginBottom: 10 }}>
          <Select value={store.accentColor} onChange={store.setAccentColor} style={{ width: 120 }}
            options={ACCENTS.map((a) => ({ label: <span><span style={{ color: a.value }}>●</span> {a.label}</span>, value: a.value }))} />
        </Form.Item>
        <Form.Item label={`${t('settings.fontSize')}: ${store.fontSize}px`} style={{ marginBottom: 10 }}>
          <Slider min={12} max={18} step={1} value={parseInt(store.fontSize, 10)} onChange={(v) => store.setFontSize(String(v))} style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label={t('settings.language')} style={{ marginBottom: 10 }}>
          <Select value={store.language} onChange={store.setLanguage} style={{ width: 120 }}
            options={[{ label: t('settings.zh'), value: 'zh' }, { label: t('settings.en'), value: 'en' }]} />
        </Form.Item>
        <Form.Item label={t('settings.retention')} style={{ marginBottom: 10 }}>
          <Slider min={1} max={30} step={1} value={parseInt(store.retentionDays, 10)} onChange={(v) => store.setRetentionDays(String(v))} style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label={t('settings.maxRecords')} style={{ marginBottom: 10 }}>
          <Slider min={100} max={5000} step={100} value={store.maxRecords} onChange={store.setMaxRecords} style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label={t('settings.startup')} style={{ marginBottom: 10 }}>
          <Switch checked={store.autoLaunch} onChange={store.setAutoLaunch} />
        </Form.Item>
        <Form.Item label={t('settings.version')} style={{ marginBottom: 0 }}>
          <span style={{ color: '#999', fontSize: 12 }}>v0.1.0</span>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Settings;
