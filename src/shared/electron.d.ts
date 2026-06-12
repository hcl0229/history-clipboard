/**
 * History Clipboard — 第三方模块类型声明
 * @version 1.0
 * @date 2026-06-10
 */

declare module 'auto-launch' {
  interface AutoLaunchOptions {
    name: string;
    path?: string;
    isHidden?: boolean;
  }

  class AutoLaunch {
    constructor(options: AutoLaunchOptions);
    enable(): Promise<void>;
    disable(): Promise<void>;
    isEnabled(): Promise<boolean>;
  }

  export = AutoLaunch;
}

declare namespace Electron {
  interface App {
    isQuitting?: boolean;
  }
}
