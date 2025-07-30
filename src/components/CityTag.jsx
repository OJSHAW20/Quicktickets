// src/components/CityTag.jsx
import React from "react";
import Link from "next/link";

export default function CityTag({ city, flag, className = "" }) {
  const citySlug = city.toLowerCase();
  return (
    <Link href={`/${citySlug}`}> 
      <div
        className={
          `inline-flex items-center space-x-2 rounded-lg border-2 border-black 
           bg-blue-100 px-4 py-2 text-lg font-medium cursor-pointer` + 
          ` ${className}`
        }
      >
        <span>{city}</span>
        {flag && <span className="text-xl">{flag}</span>}
      </div>
    </Link>
  );
}