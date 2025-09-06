// app/faqs/page.jsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// FAQ items with placeholder answers
const faqs = [
  {
    question: 'What is this site',
    answer: 'A peer-to-peer marketplace where university students can buy and sell spare event or club-night tickets in 3 clicks.',
  },
  { question: 'Do I need an account to buy', answer: 'No, just to sell' },
  { question: 'Does it cost?', answer: 'No!, we take the lowest commision in the industry' },
  { question: 'Is it safe?', answer: 'Yes very!. The seller wont go paid until 24 hours post event and if the ticket was fautly the buyer will be refunded and the seller will be banned' },
  { question: 'How do I sell a ticket?', answer: 'To sell a ticket we will take you through the steps to sign up to stripe (a secure payment platform), this will take very quick and then you can sell freely from then on ' },
  { question: 'How do I get paid?', answer: 'You will be paid via Stripe. You will need to connect your Stripe account to the website. You will then be able to withdraw your funds.' },
];

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <main className="mx-auto max-w-xs sm:max-w-3xl p-2 sm:p-6 space-y-2 sm:space-y-3 pt-20 sm:pt-24">
      {/* Blue FAQs heading */}
      <div className="bg-blue-200 border-2 border-black rounded-lg py-1.5 sm:py-3 px-2 sm:px-4">
        <h1 className="text-xl sm:text-3xl font-bold text-center">FAQs</h1>
      </div>

      {/* Intro blue box */}
      <div className="bg-blue-100 border-2 border-black rounded-lg p-2 sm:p-4">
        <p className="text-center text-sm sm:text-base">
          Buy early, sell later - flexibility for your night out.<br />
          Grab a ticket now, and if plans change, easily resell it
        </p>
      </div>

      {/* Accordion list of questions */}
      <div className="space-y-0.5 sm:space-y-1">
        {faqs.map((item, idx) => (
          <div key={idx}>
            <div
              className="bg-gray-300 border-2 border-black rounded-lg flex justify-between items-center px-2 sm:px-4 py-1.5 sm:py-2 cursor-pointer transition-all duration-200 hover:bg-gray-400"
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl">❓</span>
                <span className="font-medium text-sm sm:text-lg">{item.question}</span>
              </div>
              <div className={`transition-transform duration-200 ${openIndex === idx ? 'rotate-90' : ''}`}>
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === idx ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-white border-2 border-t-0 border-black rounded-b-lg px-2 sm:px-4 py-2 sm:py-3">
                <p className="text-gray-700 text-sm sm:text-base">
                  {item.answer || 'Answer coming soon.'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center space-x-2 mt-1">
        <span className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full" />
        <span className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full" />
        <span className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full" />
      </div>

      {/* Bottom info blue box */}
      <div className="bg-blue-100 border-2 border-black rounded-lg p-2 sm:p-4 space-y-1.5 sm:space-y-2">
        <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
          <span>🔒</span>
          Payments securely processed by Stripe
        </p>
        <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
          <span>⏳</span>
          24-hour refund window via escrow
        </p>
        <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
          <span>📧</span>
          Disputes? Settled by our team on website
        </p>
      </div>
    </main>
  );
}
