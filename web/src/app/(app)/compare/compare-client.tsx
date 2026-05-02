"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { MatchScoreRing } from "@/components/ui/match-score";
import { Button } from "@/components/ui/button";

type University = {
  id: number;
  name: string;
  location: string;
  province: string;
  established: number | null;
  type: string | null;
  acceptanceRate: number | null;
  annualFeePKR: number | null;
  studentFacultyRatio: string | null;
  rankingPakistan: number | null;
  hecRecognized: boolean;
  hostelAvailable: boolean | null;
  scholarshipAvailable: boolean | null;
  website: string | null;
  entryTestRequired: string | null;
  programs: Array<{ id: number; name: string }>;
  matches?: Array<{ matchScore: number | null; isEligible: boolean }>;
};

type ShortlistItem = {
  id: number;
  name: string;
  province: string;
};

interface Props {
  selectedUniversities: University[];
  shortlisted: ShortlistItem[];
}

const COMPARE_ROWS = [
  { key: "ranking", label: "Pakistan Ranking", icon: "🏆" },
  { key: "type", label: "Type", icon: "🏛" },
  { key: "established", label: "Established", icon: "📅" },
  { key: "fee", label: "Annual Fee (PKR)", icon: "💰" },
  { key: "acceptance", label: "Acceptance Rate", icon: "📊" },
  { key: "ratio", label: "Student:Faculty", icon: "👥" },
  { key: "programs", label: "Programs Offered", icon: "📖" },
  { key: "entryTest", label: "Entry Tests", icon: "📝" },
  { key: "hostel", label: "Hostel", icon: "🏠" },
  { key: "scholarship", label: "Scholarship", icon: "🎓" },
  { key: "hec", label: "HEC Recognized", icon: "✅" },
  { key: "location", label: "Location", icon: "📍" },
];

function getValue(uni: University, key: string): string {
  switch (key) {
    case "ranking":
      return uni.rankingPakistan ? `#${uni.rankingPakistan}` : "—";
    case "type":
      return uni.type ?? "—";
    case "established":
      return uni.established?.toString() ?? "—";
    case "fee":
      return uni.annualFeePKR
        ? `PKR ${uni.annualFeePKR.toLocaleString("en-PK")}`
        : "—";
    case "acceptance":
      return uni.acceptanceRate ? `${uni.acceptanceRate}%` : "—";
    case "ratio":
      return uni.studentFacultyRatio ?? "—";
    case "programs":
      return uni.programs.length.toString();
    case "entryTest":
      return uni.entryTestRequired ?? "—";
    case "hostel":
      return uni.hostelAvailable === true
        ? "✓ Available"
        : uni.hostelAvailable === false
          ? "✗ No"
          : "—";
    case "scholarship":
      return uni.scholarshipAvailable === true
        ? "✓ Available"
        : uni.scholarshipAvailable === false
          ? "✗ No"
          : "—";
    case "hec":
      return uni.hecRecognized ? "✓ Yes" : "✗ No";
    case "location":
      return `${uni.location}, ${uni.province}`;
    default:
      return "—";
  }
}

function isBetter(key: string, val: string): boolean {
  if (key === "hostel" || key === "scholarship" || key === "hec")
    return val.startsWith("✓");
  return false;
}

export function CompareClient({ selectedUniversities, shortlisted }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<University[]>(selectedUniversities);
  const [addId, setAddId] = useState("");

  function addUniversity(id: number) {
    if (selected.length >= 3 || selected.some((u) => u.id === id)) return;

    // Fetch university data
    fetch(`/api/universities/${id}`)
      .then((r) => r.json())
      .then((uni) => {
        setSelected((prev) => [...prev, uni]);
        const ids = [...selected.map((u) => u.id), id].join(",");
        router.push(`/compare?ids=${ids}`);
      });
  }

  function removeUniversity(id: number) {
    const next = selected.filter((u) => u.id !== id);
    setSelected(next);
    if (next.length > 0) {
      router.push(`/compare?ids=${next.map((u) => u.id).join(",")}`);
    } else {
      router.push("/compare");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h1">Compare Universities ⚖️</Heading>
        <Text variant="secondary" size="sm" className="mt-1">
          Select up to 3 universities to compare side-by-side
        </Text>
      </div>

      {/* University picker */}
      {selected.length < 3 && (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {shortlisted.length > 0 && (
              <div className="flex-1">
                <label className="text-sm font-medium text-text mb-1.5 block">
                  Add from shortlist
                </label>
                <select
                  value={addId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) addUniversity(id);
                    setAddId("");
                  }}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Select a university...</option>
                  {shortlisted
                    .filter((s) => !selected.some((u) => u.id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.province}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <Text variant="secondary" size="sm">
              {selected.length}/3 selected
            </Text>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {selected.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">⚖️</span>
          <Heading as="h3">No universities selected</Heading>
          <Text variant="secondary" size="sm" className="max-w-sm text-center">
            {shortlisted.length > 0
              ? "Select universities from your shortlist above to start comparing."
              : "Star some universities from the Universities page first, then come back here to compare them."}
          </Text>
          {shortlisted.length === 0 && (
            <Button
              variant="secondary"
              onClick={() => router.push("/universities")}
            >
              Browse Universities
            </Button>
          )}
        </Card>
      )}

      {/* Comparison table */}
      {selected.length >= 2 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-4 text-left font-medium text-text-secondary w-40">
                  Feature
                </th>
                {selected.map((uni) => (
                  <th key={uni.id} className="pb-4 text-center min-w-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      {uni.matches?.[0]?.matchScore !== undefined && (
                        <MatchScoreRing
                          score={uni.matches[0].matchScore}
                          size={44}
                        />
                      )}
                      <span className="font-semibold text-text text-xs">
                        {uni.name}
                      </span>
                      <button
                        onClick={() => removeUniversity(uni.id)}
                        className="text-[10px] text-text-secondary hover:text-error transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span>{row.icon}</span>
                      <span className="text-xs font-medium">{row.label}</span>
                    </span>
                  </td>
                  {selected.map((uni) => {
                    const val = getValue(uni, row.key);
                    const good = isBetter(row.key, val);
                    return (
                      <td
                        key={uni.id}
                        className={`py-3 text-center text-xs font-medium ${good ? "text-primary" : "text-text"}`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Single selected — prompt to add more */}
      {selected.length === 1 && (
        <Card className="flex flex-col items-center py-8 gap-3">
          <Text variant="secondary" size="sm">
            Add at least one more university to compare
          </Text>
        </Card>
      )}
    </div>
  );
}
