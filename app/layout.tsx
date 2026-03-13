import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Match Analyzer",
  description:
    "Compare your resume with job descriptions and discover missing skills instantly.",
  icons: {
    icon: "/headhunting.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <main style={{ flex: 1 }}>{children}</main>

        <footer
          style={{
            padding: "18px",
            textAlign: "center",
            fontSize: "13px",
            color: "#94a3b8",
            borderTop: "1px solid #23262d",
          }}
        >
          © {new Date().getFullYear()} Resume Match Analyzer • Built by Romit Jajal
        </footer>
      </body>
    </html>
  );
}