import type { Metadata } from "next";
import "./globals.css";

const title = "高中生物动态交互模型";
const description =
  "通过动态交互模型探究动作电位、突触传递、免疫调节等高中生物核心过程。";
const publicSiteUrl = "https://meiosis7.github.io/biology-interactive-models/";
const socialImageUrl = `${publicSiteUrl}og.png`;

export const metadata: Metadata = {
  metadataBase: new URL("https://meiosis7.github.io/biology-interactive-models/"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: publicSiteUrl,
    images: [{ url: socialImageUrl, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
