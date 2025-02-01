import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "525d956d-b1eb-49dd-9b29-ca0d61f081a4",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin + window.location.pathname,
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          case 2:
            console.info(message);
            break;
          case 3:
            console.debug(message);
            break;
        }
      },
      piiLoggingEnabled: false
    }
  }
};

// 建立 MSAL 實例
export const msalInstance = new PublicClientApplication(msalConfig);

// 清除所有快取的帳戶
msalInstance.getAllAccounts().forEach(account => {
  msalInstance.removeAccount(account);
});

// 初始化 MSAL 實例的函數
export async function initializeMsal() {
  try {
    await msalInstance.initialize();
    console.log('MSAL 實例已初始化');
    return msalInstance;
  } catch (error) {
    console.error('MSAL 初始化失敗:', error);
    throw error;
  }
}

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "User.Read",
    "Files.Read",
    "Files.ReadWrite"
  ],
  prompt: "select_account"
};