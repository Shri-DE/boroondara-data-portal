// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ThemeProvider, initializeIcons } from "@fluentui/react";

import App from "./App";
import { msalInstance, ensureMsalInitialized } from "./auth/msalInstance";
import { boroondaraTheme, boroondaraPalette } from "./theme/boroondaraTheme";

initializeIcons();

async function bootstrap() {
  await ensureMsalInitialized();

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Make the whole site feel like the Home page
  document.body.style.margin = "0";
  document.body.style.background = boroondaraPalette.bg;
  document.body.style.color = boroondaraPalette.text;

  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider theme={boroondaraTheme}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </MsalProvider>
    </React.StrictMode>
  );
}

bootstrap();
