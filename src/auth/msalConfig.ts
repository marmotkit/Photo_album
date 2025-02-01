import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "525d956d-b1eb-49dd-9b29-ca0d61f081a4",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  }
};

// 建立 MSAL 實例
const msalInstance = new PublicClientApplication(msalConfig);

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

export { msalInstance };

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "User.Read",
    "Files.Read",
    "Files.ReadWrite"
  ]
};