import React from "react";
import Link from "next/link";

const Header = () => {
  return (
    <header  className="fixed top-0 inset-x-0 h-20 z-50 bg-white border-b flex items-center justify-between px-4">
      <Link href="/" className="text-xl font-bold">
        webname
      </Link>
      <nav className="flex space-x-4 text-sm">
        <Link href="/signup" className="hover:underline">Sign up</Link>
        <Link href="/login" className="hover:underline">Log in</Link>
        <Link href="/faqs" className="hover:underline">FAQs</Link>
        <Link href="/listings" className="hover:underline">My listings</Link>
      </nav>
    </header>
  );
};

export default Header;

