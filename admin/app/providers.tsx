"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId="259422007851-ueiubk65cqerb3r0sg04quee5qustf8f.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
}
