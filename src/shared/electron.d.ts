/**
 * Type declarations for modules without @types
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
