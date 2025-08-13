// --- src/app/layout.js (VIP Command Center) ---
import "./globals.css";
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-heading', weight: ['600', '700'], display: 'swap' });

export const metadata = {
  title: "VIP Command Center",
  description: "Admin portal for the VIP Mentorship Hub.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  );
}