import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — UniGo" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">Settings</Heading>

      {/* Account info */}
      <Card>
        <Heading as="h3" className="mb-4">
          Account Information
        </Heading>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Full Name</span>
            <span className="font-medium text-text">{user.fullName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Email</span>
            <span className="font-medium text-text">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Member Since</span>
            <span className="font-medium text-text">
              {new Date(user.createdAt).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <SettingsClient />

      {/* Danger zone */}
      <Card className="border-red-200">
        <Heading as="h4" className="mb-2 text-error">
          Danger Zone
        </Heading>
        <Text variant="secondary" size="sm">
          Account deletion is not available at this time. Contact an
          administrator if you need to remove your account.
        </Text>
      </Card>
    </div>
  );
}
