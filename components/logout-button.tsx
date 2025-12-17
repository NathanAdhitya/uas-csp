"use client";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/user-actions";

export function LogoutButton() {
  return <Button onClick={logoutUser}>Logout</Button>;
}
