"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SplitLayout } from "@/components/layout/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormWrapper } from "@/components/ui/form-wrapper";
import { Heading, Text } from "@/components/ui/typography";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 2) {
      errors.fullName = "Name must be at least 2 characters";
    }
    if (!email.includes("@")) {
      errors.email = "Please enter a valid email";
    }
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!agreed) {
      errors.agreed = "You must agree to the terms";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
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
          <Heading as="h1">Create your account</Heading>
          <Text variant="secondary" size="sm">
            Start finding universities that match your profile
          </Text>
        </div>

        {/* Form */}
        <FormWrapper onSubmit={handleSubmit}>
          <Input
            id="signup-fullname"
            label="Full name"
            type="text"
            placeholder="Ahmad Khan"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
            required
          />

          <Input
            id="signup-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />

          <Input
            id="signup-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />

          <Input
            id="signup-confirm-password"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            required
          />

          <Checkbox
            id="signup-terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            label={
              <>
                I have read and agree to the{" "}
                <span className="underline">Terms of Service</span> and{" "}
                <span className="underline">Privacy Policy</span>.
              </>
            }
          />
          {fieldErrors.agreed && (
            <p className="text-xs text-error -mt-3">{fieldErrors.agreed}</p>
          )}

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Creating account..." : "Continue"}
          </Button>
        </FormWrapper>

        {/* Footer link */}
        <Text variant="secondary" size="sm">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </Text>
      </div>
    </SplitLayout>
  );
}
