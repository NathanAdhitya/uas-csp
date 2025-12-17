"use server";
import { redirect } from "next/navigation";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function Welcome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <div>
      <h2 className="text-xl"><span className="font-bold">Welcome, </span>{data.claims.email}</h2>
    </div>
  );
}

async function Announcements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading announcements</div>;
  }
  return (
    <div>
      {data.map((announcement) => (
        <Card key={announcement.id} className="mb-4">
          <CardHeader>
            <CardTitle>{announcement.title}</CardTitle>
            <pre className="text-sm text-muted-foreground text-wrap">
              {announcement.content}
            </pre>
          </CardHeader>
          <CardFooter>
            <span className="text-sm text-muted-foreground">
              Created at: {" "}
              {new Date(announcement.created_at).toLocaleString()}
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default async function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <Suspense>
          <Welcome />
        </Suspense>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl">Announcements</h2>
        <Suspense>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
}
