import { Configuration, PublicClientApplication } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "525d956d-b1eb-49dd-9b29-ca0d61f081a4",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  }
};

// 建立並初始化 MSAL 實例
const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();

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