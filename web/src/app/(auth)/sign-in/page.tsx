"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SplitLayout } from "@/components/layout/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormWrapper } from "@/components/ui/form-wrapper";
import { Heading, Text } from "@/components/ui/typography";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }

      router.push("/universities");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SplitLayout>
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <Link href="/" className="text-2xl font-semibold text-primary">
          UniGo
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <Heading as="h1">Welcome back</Heading>
          <Text variant="secondary" size="sm">
            Sign in to your account to continue
          </Text>
        </div>

        {/* Form */}
        <FormWrapper onSubmit={handleSubmit}>
          <Input
            id="signin-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="signin-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </FormWrapper>

        {/* Footer link */}
        <Text variant="secondary" size="sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </Text>
      </div>
    </SplitLayout>
  );
}
