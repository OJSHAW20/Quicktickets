import "../styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Header from '../components/Header'
import Footer from '../components/Footer';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quicktickets",
  description: "Quciktickets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-dvh"><body
      className="h-full grid grid-rows-[auto_1fr_auto] antialiased"
    >
      <Header />
      <main className="overflow-y-auto">{children}</main>
      <Footer />
    </body></html>
  );
}
