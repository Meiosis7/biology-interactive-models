import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "高中生物动态交互模型";
const description =
  "通过动态交互模型探究动作电位、突触传递、免疫调节等高中生物核心过程。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const imageUrl = `${origin}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: origin,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

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
