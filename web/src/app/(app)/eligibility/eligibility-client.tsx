"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MatchScoreBadge } from "@/components/ui/match-score";

type MatchResult = {
  id: number;
  isEligible: boolean;
  matchScore: number | null;
  reasonCodes: string[];
  university: {
    id: number;
    name: string;
    province: string;
    annualFeePKR: number | null;
    rankingPakistan: number | null;
  };
  program: { id: number; name: string } | null;
};

interface Props {
  studentId: number;
  hasInterPercentage: boolean;
  hasTestScores: boolean;
  existingMatches: MatchResult[];
  provinces: string[];
}

const REASON_LABELS: Record<string, string> = {
  ELIGIBLE: "Eligible",
  LOW_INTER_PERCENTAGE: "Inter % too low",
  REQUIRED_TEST_NOT_FOUND: "Required test not taken",
  ENTRY_TEST_SCORE_TOO_LOW: "Entry test score too low",
  NO_ACTIVE_CRITERIA: "No criteria defined",
  NOT_ELIGIBLE: "Not eligible",
};

export function EligibilityClient({
  studentId,
  hasInterPercentage,
  hasTestScores,
  existingMatches,
  provinces,
}: Props) {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>(existingMatches);
  const [province, setProvince] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [programKeyword, setProgramKeyword] = useState("");
  const [hecOnly, setHecOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    total: number;
    eligible: number;
  } | null>(null);
  const [showOnlyEligible, setShowOnlyEligible] = useState(false);

  const profileIncomplete = !hasInterPercentage && !hasTestScores;

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      // Run evaluation
      const evalRes = await fetch("/api/eligibility/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          ...(province ? { province } : {}),
          ...(maxFee ? { maxAnnualFeePKR: Number(maxFee) } : {}),
          ...(programKeyword ? { programKeyword } : {}),
          ...(hecOnly ? { onlyHECRecognized: true } : {}),
        }),
      });

      if (!evalRes.ok) {
        const data = await evalRes.json();
        setError(data.error ?? "Evaluation failed");
        return;
      }

      const evalData = await evalRes.json();
      setSummary({
        total: evalData.totalEvaluated,
        eligible: evalData.eligibleCount,
      });

      // Fetch detailed results
      const matchRes = await fetch(
        `/api/students/${studentId}/matches?limit=200`
      );
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatches(matchData.data);
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredMatches = (showOnlyEligible
    ? matches.filter((m) => m.isEligible)
    : matches
  ).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  const eligibleCount = matches.filter((m) => m.isEligible).length;

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">Check Eligibility</Heading>

      {profileIncomplete && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-text">
                Complete your profile first
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Add your intermediate percentage and test scores on the{" "}
                <Link
                  href="/students"
                  className="text-primary hover:underline font-medium"
                >
                  Students page
                </Link>{" "}
                for accurate eligibility results.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter form */}
      <Card>
        <Heading as="h3" className="mb-4">
          Filters
        </Heading>
        <form onSubmit={handleEvaluate} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="elig-province"
                className="text-sm font-medium text-text"
              >
                Province
              </label>
              <select
                id="elig-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">All Provinces</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="elig-maxfee"
              label="Max Annual Fee (PKR)"
              type="number"
              min={0}
              placeholder="e.g. 500000"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
            />

            <Input
              id="elig-program"
              label="Program Keyword"
              placeholder="e.g. Computer Science"
              value={programKeyword}
              onChange={(e) => setProgramKeyword(e.target.value)}
            />
          </div>

          <Checkbox
            id="elig-hec"
            checked={hecOnly}
            onChange={(e) => setHecOnly(e.target.checked)}
            label="Only HEC recognized universities"
          />

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Evaluating..." : "Run Eligibility Check"}
          </Button>
        </form>
      </Card>

      {/* Summary */}
      {(summary || matches.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex flex-col items-center gap-1 py-4">
            <span className="text-2xl font-bold text-text">
              {summary?.total ?? matches.length}
            </span>
            <span className="text-xs text-text-secondary">
              Programs Evaluated
            </span>
          </Card>
          <Card className="flex flex-col items-center gap-1 py-4">
            <span className="text-2xl font-bold text-primary">
              {summary?.eligible ?? eligibleCount}
            </span>
            <span className="text-xs text-text-secondary">Eligible</span>
          </Card>
          <Card className="flex flex-col items-center gap-1 py-4">
            <span className="text-2xl font-bold text-text-secondary">
              {(summary?.total ?? matches.length) -
                (summary?.eligible ?? eligibleCount)}
            </span>
            <span className="text-xs text-text-secondary">Not Eligible</span>
          </Card>
        </div>
      )}

      {/* Results */}
      {matches.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Heading as="h3">Results</Heading>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyEligible}
                onChange={(e) => setShowOnlyEligible(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span className="text-sm text-text-secondary">
                Eligible only
              </span>
            </label>
          </div>

          {filteredMatches.length === 0 ? (
            <Text variant="secondary" size="sm">
              No matching results found.
            </Text>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-text-secondary">
                      University
                    </th>
                    <th className="pb-3 font-medium text-text-secondary">
                      Program
                    </th>
                    <th className="pb-3 font-medium text-text-secondary">
                      Score
                    </th>
                    <th className="pb-3 font-medium text-text-secondary">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-text-secondary">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr
                      key={match.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/universities/${match.university.id}`}
                          className="text-text font-medium hover:text-primary transition-colors"
                        >
                          {match.university.name}
                        </Link>
                        <div className="text-xs text-text-secondary">
                          {match.university.province}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {match.program?.name ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <MatchScoreBadge score={match.matchScore} />
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            match.isEligible
                              ? "bg-primary-light text-primary"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {match.isEligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-text-secondary">
                        {match.reasonCodes
                          .map((r) => REASON_LABELS[r] ?? r)
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
