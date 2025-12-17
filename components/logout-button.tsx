"use client";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/user-actions";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    setIsLoading(true);
    await logoutUser();
    setIsLoading(false);
  };

  return (
    <Button onClick={onClick} disabled={isLoading}>
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
