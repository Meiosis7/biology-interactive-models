import "./globals.css";

export const metadata = {
  title: "动作电位的形成和传导｜高中生物交互模型",
  description: "通过刺激强度、刺激位置和记录电极，探究动作电位的形成、膜电位变化与神经纤维传导。",
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
