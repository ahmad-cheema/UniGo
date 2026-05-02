"use client";

import { useState } from "react";
import { Heading } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SettingsClient() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password change API not implemented yet
    setSuccess(
      "Password change feature coming soon. Your password was not changed."
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <Card>
      <Heading as="h3" className="mb-4">
        Change Password
      </Heading>
      <form
        onSubmit={handleChangePassword}
        className="flex flex-col gap-4 max-w-md"
      >
        <Input
          id="settings-current-password"
          label="Current Password"
          type="password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          id="settings-new-password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          id="settings-confirm-password"
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}

        <Button type="submit" variant="secondary">
          Update Password
        </Button>
      </form>
    </Card>
  );
}
