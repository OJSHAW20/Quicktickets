import React from "react";

const Footer = () => {
    return (
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 h-[70px] z-50 bg-gray-200 border-t items-center justify-center px-4">
        <div className="text-center space-y-1 leading-tight">
          <p className="font-bold text-sm">End ticket stress. Find, sell, and secure in seconds</p>
          <p className="text-xs text-gray-600">🔐 Secure payments via Stripe • ⏳ 24h buyer protection via escrow</p>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  
