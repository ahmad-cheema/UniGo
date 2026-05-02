"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TestScore = {
  id: number;
  testType: string;
  score: number;
  maxScore: number | null;
  examDate: string | null;
};

type Profile = {
  id: number;
  fullName: string;
  email: string;
  province: string | null;
  interests: string[];
  matricPercentage: number | null;
  interPercentage: number | null;
  testScores: TestScore[];
};

interface Props {
  profile: Profile;
  provinces: string[];
}

export function ProfileClient({ profile, provinces }: Props) {
  const router = useRouter();

  // Profile form state
  const [province, setProvince] = useState(profile.province ?? "");
  const [matric, setMatric] = useState(
    profile.matricPercentage?.toString() ?? ""
  );
  const [inter, setInter] = useState(
    profile.interPercentage?.toString() ?? ""
  );
  const [interests, setInterests] = useState(profile.interests.join(", "));
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Test score form state
  const [testType, setTestType] = useState("");
  const [testScore, setTestScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [addingScore, setAddingScore] = useState(false);
  const [scoreMsg, setScoreMsg] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg("");

    try {
      const res = await fetch(`/api/students/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          province: province || null,
          matricPercentage: matric ? Number(matric) : null,
          interPercentage: inter ? Number(inter) : null,
          interests: interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setProfileMsg(data.error ?? "Failed to update profile");
        return;
      }

      setProfileMsg("Profile updated successfully!");
      router.refresh();
    } catch {
      setProfileMsg("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddScore(e: React.FormEvent) {
    e.preventDefault();
    setAddingScore(true);
    setScoreMsg("");

    try {
      const res = await fetch(`/api/students/${profile.id}/test-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          score: Number(testScore),
          maxScore: maxScore ? Number(maxScore) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setScoreMsg(data.error ?? "Failed to add score");
        return;
      }

      setScoreMsg("Test score added!");
      setTestType("");
      setTestScore("");
      setMaxScore("");
      router.refresh();
    } catch {
      setScoreMsg("Something went wrong. Please try again.");
    } finally {
      setAddingScore(false);
    }
  }

  const completionItems = [
    { label: "Province", done: !!profile.province },
    { label: "Matric %", done: profile.matricPercentage !== null },
    { label: "Inter %", done: profile.interPercentage !== null },
    { label: "Test Scores", done: profile.testScores.length > 0 },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) *
    100
  );

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">My Profile</Heading>

      {/* Profile completion */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <Heading as="h4">Profile Completion</Heading>
          <span
            className={`text-sm font-semibold ${completionPct === 100 ? "text-primary" : "text-text-secondary"}`}
          >
            {completionPct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {completionItems.map((item) => (
            <span
              key={item.label}
              className={`text-xs px-2 py-1 rounded-full ${item.done
                  ? "bg-primary-light text-primary"
                  : "bg-bg text-text-secondary border border-border"
                }`}
            >
              {item.done ? "✓" : "○"} {item.label}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit profile form */}
        <Card>
          <Heading as="h3" className="mb-4">
            Academic Details
          </Heading>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            {/* Read-only fields */}
            <Input
              id="profile-name"
              label="Full Name"
              value={profile.fullName}
              disabled
            />
            <Input
              id="profile-email"
              label="Email"
              value={profile.email}
              disabled
            />

            {/* Editable fields */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-province"
                className="text-sm font-medium text-text"
              >
                Province
              </label>
              <select
                id="profile-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">Select province</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="profile-matric"
              label="Matric Percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g. 85.5"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
            />

            <Input
              id="profile-inter"
              label="Intermediate Percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g. 78.0"
              value={inter}
              onChange={(e) => setInter(e.target.value)}
            />

            <Input
              id="profile-interests"
              label="Interests (comma separated)"
              placeholder="e.g. Computer Science, Engineering, Medicine"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />

            {profileMsg && (
              <p
                className={`text-sm ${profileMsg.includes("success") ? "text-primary" : "text-error"}`}
              >
                {profileMsg}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Card>

        {/* Test scores */}
        <div className="flex flex-col gap-4">
          <Card>
            <Heading as="h3" className="mb-4">
              Test Scores
            </Heading>

            {profile.testScores.length === 0 ? (
              <Text variant="secondary" size="sm">
                No test scores added yet. Add your entry test scores below to
                check eligibility.
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {profile.testScores.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text">
                        {ts.testType}
                      </span>
                      {ts.examDate && (
                        <span className="text-xs text-text-secondary">
                          {new Date(ts.examDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {ts.score}
                      {ts.maxScore ? ` / ${ts.maxScore}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add test score form */}
          <Card>
            <Heading as="h4" className="mb-3">
              Add Test Score
            </Heading>
            <form onSubmit={handleAddScore} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="score-type"
                  className="text-sm font-medium text-text"
                >
                  Test Type
                </label>
                <select
                  id="score-type"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Select test</option>
                  <option value="MDCAT">MDCAT</option>
                  <option value="ECAT">ECAT</option>
                  <option value="HAT">HAT</option>
                  <option value="NTS">NTS</option>
                  <option value="IBA Entry Test">IBA Entry Test</option>
                  <option value="University Own Test">
                    University Own Test
                  </option>
                  <option value="AIOU Own Test">AIOU Own Test</option>
                  <option value="ISSB / PAF Selection Test">
                    ISSB / PAF Selection Test
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="score-value"
                  label="Score"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="e.g. 75"
                  value={testScore}
                  onChange={(e) => setTestScore(e.target.value)}
                  required
                />
                <Input
                  id="score-max"
                  label="Max Score (optional)"
                  type="number"
                  min={1}
                  step={0.1}
                  placeholder="e.g. 100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>

              {scoreMsg && (
                <p
                  className={`text-sm ${scoreMsg.includes("added") ? "text-primary" : "text-error"}`}
                >
                  {scoreMsg}
                </p>
              )}

              <Button type="submit" variant="secondary" disabled={addingScore}>
                {addingScore ? "Adding..." : "Add Score"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
