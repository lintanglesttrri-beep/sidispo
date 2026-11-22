import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "SIDISPO — Sistem Disposisi Surat Internal Solo Techno Park",
  description:
    "Platform pencatatan, pengarsipan, pendistribusian, dan konfirmasi penerimaan disposisi surat internal Sekretariat Solo Techno Park.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
