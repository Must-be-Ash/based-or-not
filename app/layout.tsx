import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./timer-styles.css";
import { Providers } from "./providers";
import { Pixelify_Sans } from 'next/font/google';

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-pixelify-sans',
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: "Timed Right",
    description:
      "Test your precision timing skills! Press the button as close to 00.000 as possible without hitting zero.",
    other: {
      "fc:frame": JSON.stringify({
        version: process.env.NEXT_PUBLIC_VERSION,
        imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
        button: {
          title: `Launch Precision Timer`,
          action: {
            type: "launch_frame",
            name: "Precision Timer",
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
            splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR}`,
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pixelifySans.variable}>
      <body className="bg-background min-h-screen min-w-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
