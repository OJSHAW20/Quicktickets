import React from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-gray-200 border-b flex items-center justify-between px-4">
      <Link href="/" className="text-xl font-bold truncate">
        Quicktickets
      </Link>
      <nav className="flex items-center space-x-2 text-sm min-w-0">
        <UserMenu />
        <Link href="/my-listings" className="hover:underline whitespace-nowrap">My listings</Link>
        <Link href="/faqs" className="hover:underline whitespace-nowrap">FAQs</Link>
      </nav>
    </header>
  );
};

export default Header;

