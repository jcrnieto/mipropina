export type OneSignalPromptOptions = {
  force?: boolean;
};

export type OneSignalQueueItem = (oneSignal: OneSignalInstance) => void | Promise<void>;

export type OneSignalInstance = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Slidedown: {
    promptPush: (options?: OneSignalPromptOptions) => Promise<void>;
  };
  Notifications: {
    permission: boolean;
    isPushSupported: () => boolean;
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalInstance;
    OneSignalDeferred?: OneSignalQueueItem[];
  }
}

export {};
