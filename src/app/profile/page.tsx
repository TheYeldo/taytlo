import type { Metadata } from "next";
import { ProfileClient } from "@/components/ProfileClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Профиль Taytlo: избранное, история просмотра, списки и комментарии."
};

export default function ProfilePage() {
  return (
    <main className="profile-shell">
      <ProfileClient catalog={getCatalog()} />
    </main>
  );
}
