/**
 * History Clipboard — i18n 国际化
 * @version 1.0
 * @date 2026-06-11
 *
 * 修订记录：
 *   v1.0  2026-06-11  WorkBuddy  初始版本（i18next + react-i18next，zh/en 翻译文件）
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
  resources: { zh: { translation: zh }, en: { translation: en } },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export default i18n;
