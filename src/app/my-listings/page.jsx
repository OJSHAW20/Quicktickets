// src/app/my-listings/page.jsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import TicketsBoughtPanel from "@/components/TicketsBoughtPanel";
import DisputesBuySidePanel from "@/components/DisputesBuySidePanel";
import DisputesSellSidePanel from "@/components/DisputesSellSidePanel";
import TicketsSellingPanel from "@/components/TicketsSellingPanel";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function MyListingsAccordion() {
  // build a Supabase client bound to this request’s cookies
  const supabase = createServerComponentClient({ cookies });

  // grab current session—MUST await in a server component
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // if not logged in, redirect to /signin
  if (!session) {
    redirect("/signin");
  }

  return (
    <main className="mx-auto max-w-lg p-4 space-y-4">
      <Accordion type="multiple" className="w-full">
        {/* ────────────────────────────  My details  */}
        <AccordionItem value="details">
          <AccordionTrigger className="text-lg font-semibold">
            🎓 My details
          </AccordionTrigger>
          <AccordionContent>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {/* stub fields for now */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="font-medium">Full name</span>
                  <input
                    readOnly
                    defaultValue="John Doe"
                    className="col-span-2 px-2 py-1 rounded-md border"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="font-medium">Username</span>
                  <input
                    readOnly
                    defaultValue="jdoe"
                    className="col-span-2 px-2 py-1 rounded-md border"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="font-medium">University</span>
                  <input
                    readOnly
                    defaultValue="UoE"
                    className="col-span-2 px-2 py-1 rounded-md border"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="font-medium">Uni email</span>
                  <input
                    readOnly
                    defaultValue="john@university.ac.uk"
                    className="col-span-2 px-2 py-1 rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* ────────────────────────────  My tickets bought  */}
        <AccordionItem value="tickets-bought">
          <AccordionTrigger className="text-lg font-semibold">
            🎫 My tickets bought
          </AccordionTrigger>
          <AccordionContent>
            <TicketsBoughtPanel />
          </AccordionContent>
        </AccordionItem>

        {/* ────────────────────────────  My listings  */}
        <AccordionItem value="my-listings">
          <AccordionTrigger className="text-lg font-semibold">
            📋 My listings
          </AccordionTrigger>
          <AccordionContent>
          <TicketsSellingPanel />
          </AccordionContent>
        </AccordionItem>

        {/* ────────────────────────────  On-going settlements  */}
        <AccordionItem value="settlements">
          <AccordionTrigger className="text-lg font-semibold">
            ⚖️ On-going settlements
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              {/* ——— Buy side ——— */}
              <div>
                <h5 className="font-semibold mb-2">Buy side</h5>
                <DisputesBuySidePanel />
              </div>
              {/* ——— Sell side ——— */}
              <div>
                <h5 className="font-semibold mb-2">Sell side</h5>
                <DisputesSellSidePanel />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}
