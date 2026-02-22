import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "GovContracts Dashboard",
  description: "Internal demo dashboard for government contracts"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
