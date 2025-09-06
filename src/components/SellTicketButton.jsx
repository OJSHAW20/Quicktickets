'use client';

import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SellTicketButton({ href = "/sell", className = "" }) {
  const session = useSession();
  const router = useRouter();
  const safeHref = typeof href === 'string' && href.startsWith('/') ? href : '/sell';

  function handleClick(e) {
    e.preventDefault(); // prevent default <a> navigation

    if (!session) {
      alert("Please log in first (student e-mail required).");
      router.push('/signin');
      return;
    }

    router.push(safeHref);
  }

  return (
    <a
      href={safeHref}
      onClick={handleClick}
      className={
        `inline-flex items-center space-x-2 
         rounded-lg border border-black 
         bg-green-500 px-6 py-2 
         text-lg font-semibold text-white 
         shadow-md hover:bg-green-600 transition` +
        ` ${className}`
      }
    >
      <span className="text-xl">🎟️</span>
      <span>Click to sell ticket</span>
    </a>
  );
}


