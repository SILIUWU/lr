import type { Metadata, Viewport } from "next";
import { CourseProvider } from "@/components/course-provider";
import { SiteShell } from "@/components/site-shell";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://agentic-ai-guide-cn.nobobeluong.chatgpt.site",
  ),
  title: {
    default: "Agentic AI 全栈指南 · From Foundations to Systems",
    template: "%s · Agentic AI 全栈指南",
  },
  description:
    "Haggai Roitman《The Hitchhiker’s Guide to Agentic AI》的逐节中文网页译读：30 章原生正文、精确页码、交互实验与学习题。",
  applicationName: "Agentic AI 全栈指南",
  authors: [
    { name: "Haggai Roitman", url: "https://arxiv.org/abs/2606.24937" },
  ],
  keywords: [
    "Agentic AI",
    "LLM",
    "RAG",
    "Memory",
    "MCP",
    "A2A",
    "Multi-Agent",
    "AI 学习",
  ],
  openGraph: {
    title: "Agentic AI 全栈指南",
    description: "从模型底座，到可以被信任的自主系统。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Agentic AI 全栈指南 · From Foundations to Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic AI 全栈指南",
    description: "从模型底座，到可以被信任的自主系统。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#111923" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <CourseProvider>
          <SiteShell>{children}</SiteShell>
        </CourseProvider>
      </body>
    </html>
  );
}
