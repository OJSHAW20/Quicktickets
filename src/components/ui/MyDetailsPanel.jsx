// src/components/ui/MyDetailsPanel.jsx
import React from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function MyDetailsPanel() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser(); // more secure than getSession()
  if (!user) return <p className="text-sm text-red-500">Not signed in.</p>;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, university, email")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return <p className="text-sm text-red-500">Failed to load profile.</p>;
  }

  return (
    <div className="space-y-4">
      {/** Full name **/}
      <div className="grid grid-cols-3 items-center gap-2">
        <span className="font-medium">Full name</span>
        <input
          readOnly
          value={profile.name || ""}
          className="col-span-2 px-2 py-1 rounded-md border bg-gray-100"
        />
      </div>

      {/** University **/}
      <div className="grid grid-cols-3 items-center gap-2">
        <span className="font-medium">University</span>
        <input
          readOnly
          value={profile.university || ""}
          className="col-span-2 px-2 py-1 rounded-md border bg-gray-100"
        />
      </div>

      {/** Uni email **/}
      <div className="grid grid-cols-3 items-center gap-2">
        <span className="font-medium">Uni email</span>
        <input
          readOnly
          value={profile.email || ""}
          className="col-span-2 px-2 py-1 rounded-md border bg-gray-100"
        />
      </div>
    </div>
  );
}
