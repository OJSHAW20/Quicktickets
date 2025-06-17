// src/components/SellTicketButton.jsx

import React from "react";
import Link from "next/link";

export default function SellTicketButton({ href = "/sell", className = "" }) {
  return (
    <Link href={href}>
      <div
        className={
          `inline-flex items-center space-x-2 
+          rounded-lg border border-black 
+          bg-green-500 px-6 py-2 
+          text-lg font-semibold text-white 
+          shadow-md hover:bg-green-600 transition` +
          ` ${className}`
        }
      >
        <span className="text-xl">🎟️</span>
        <span>Click to sell ticket</span>
      </div>
    </Link>
  );
}


