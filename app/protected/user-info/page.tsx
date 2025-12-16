"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { TablesInsert } from "@/lib/db.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserInfoFormState = {
  ktp_number: string;
  name: string;
  address: string;
  photo_url: string;
};

const emptyForm: UserInfoFormState = {
  ktp_number: "",
  name: "",
  address: "",
  photo_url: "",
};

export default function UserInfoPage() {
  const router = useRouter();
  const [values, setValues] = useState<UserInfoFormState>(emptyForm);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/auth/login");
        return;
      }

      if (!active) return;
      setUserId(user.id);

      const { data, error: infoError } = await supabase
        .from("user_info")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (infoError) {
        setError(infoError.message);
      } else if (data) {
        setValues({
          ktp_number: data.ktp_number ?? "",
          name: data.name ?? "",
          address: data.address ?? "",
          photo_url: data.photo_url ?? "",
        });
      }

      setIsLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const normalize = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const payload: TablesInsert<"user_info"> = {
      id: userId,
      ktp_number: normalize(values.ktp_number),
      name: normalize(values.name),
      address: normalize(values.address),
      photo_url: normalize(values.photo_url),
    };

    const { error: saveError } = await supabase
      .from("user_info")
      .upsert(payload, { onConflict: "id" });

    if (saveError) {
      setError(saveError.message);
    } else {
      setSuccess("Your changes have been saved.");
    }

    setIsSaving(false);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const extensionFromName = () => {
      const parts = file.name.split(".");
      return parts.length > 1 ? parts.pop()?.toLowerCase() ?? null : null;
    };

    const extensionFromType = () => {
      const [, subtype] = file.type.split("/");
      return subtype ? subtype.toLowerCase() : null;
    };

    const extension = extensionFromName() ?? extensionFromType() ?? "jpg";
    const path = `${userId}/profile_picture.${extension}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("profile_picture")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile_picture")
      .getPublicUrl(path);

    setValues((prev) => ({ ...prev, photo_url: publicUrlData.publicUrl }));
    setSuccess("Photo uploaded. Remember to save changes.");
    setIsUploading(false);
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">User info</h1>
        <p className="text-muted-foreground text-sm">
          Update the data associated with your account.
        </p>
      </div>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ktp_number">KTP number</Label>
              <Input
                id="ktp_number"
                name="ktp_number"
                placeholder="Enter your KTP number"
                value={values.ktp_number}
                onChange={handleChange}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={values.name}
                onChange={handleChange}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Enter your address"
                value={values.address}
                onChange={handleChange}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_photo">Profile photo</Label>
              <Input
                id="profile_photo"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isLoading || isSaving || isUploading || !userId}
              />
              <p className="text-xs text-muted-foreground">
                Uploads go to <code>profile_picture</code>/
                {"{uid}/profile_picture.ext"}.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                name="photo_url"
                type="url"
                placeholder="https://example.com/you.jpg"
                value={values.photo_url}
                onChange={handleChange}
                disabled={isLoading || isSaving}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSaving || isLoading || !userId}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
