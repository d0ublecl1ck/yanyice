import type { Metadata, Viewport } from "next";

import { ToastContainer } from "@/components/ToastContainer";

import "./globals.css";

export const metadata: Metadata = {
  title: "研易册 - 命理工作台",
  description: "专业命理案例管理工作台",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
