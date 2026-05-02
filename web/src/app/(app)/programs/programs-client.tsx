"use client";

import { useState } from "react";
import Link from "next/link";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Program = {
  id: number;
  name: string;
  university: {
    id: number;
    name: string;
    province: string;
    location: string;
    annualFeePKR: number | null;
    rankingPakistan: number | null;
    hecRecognized: boolean;
    scholarshipAvailable: boolean | null;
    hostelAvailable: boolean | null;
    entryTestRequired: string | null;
  };
  eligibilityCriteria: Array<{
    minInterPercentage: number | null;
    minEntryTestScore: number | null;
    acceptedEntryTests: string[];
  }>;
};

interface Props {
  provinces: string[];
}

export function ProgramsClient({ provinces }: Props) {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [results, setResults] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ search });
      if (province) params.set("province", province);

      const res = await fetch(`/api/programs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Group results by program name
  const grouped = results.reduce(
    (acc, p) => {
      if (!acc[p.name]) acc[p.name] = [];
      acc[p.name].push(p);
      return acc;
    },
    {} as Record<string, Program[]>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h1">Program Explorer 🔍</Heading>
        <Text variant="secondary" size="sm" className="mt-1">
          Search for a program and see which universities offer it across
          Pakistan
        </Text>
      </div>

      {/* Search form */}
      <Card>
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              id="program-search"
              label="Program Name"
              placeholder="e.g. Computer Science, MBBS, BBA, Engineering..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              required
            />
          </div>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="">All Provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || search.length < 2}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </Card>

      {/* Popular searches */}
      {!searched && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-text-secondary">Popular:</span>
          {[
            "Computer Science",
            "MBBS",
            "BBA",
            "Engineering",
            "Software",
            "Data Science",
            "AI",
            "Law",
            "Pharmacy",
          ].map((q) => (
            <button
              key={q}
              onClick={() => {
                setSearch(q);
                // auto-search
                setTimeout(async () => {
                  setLoading(true);
                  setSearched(true);
                  const res = await fetch(
                    `/api/programs?search=${encodeURIComponent(q)}${province ? `&province=${province}` : ""}`
                  );
                  if (res.ok) {
                    const data = await res.json();
                    setResults(data.data);
                  }
                  setLoading(false);
                }, 0);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-4xl">🔍</span>
          <Text variant="secondary">
            No programs found matching &quot;{search}&quot;
          </Text>
        </div>
      )}

      {Object.entries(grouped).map(([programName, programs]) => (
        <div key={programName}>
          <div className="flex items-center gap-3 mb-3">
            <Heading as="h3">{programName}</Heading>
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
              {programs.length} {programs.length === 1 ? "university" : "universities"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {programs.map((p) => (
              <Link key={`${p.id}-${p.university.id}`} href={`/universities/${p.university.id}`}>
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-text">
                        {p.university.name}
                      </h4>
                      {p.university.hecRecognized && (
                        <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                          HEC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span>📍 {p.university.location}, {p.university.province}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {p.university.rankingPakistan && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          Rank #{p.university.rankingPakistan}
                        </span>
                      )}
                      {p.university.scholarshipAvailable && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          💰 Scholarship
                        </span>
                      )}
                      {p.university.hostelAvailable && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          🏠 Hostel
                        </span>
                      )}
                    </div>

                    {p.eligibilityCriteria.length > 0 && (
                      <div className="flex items-center gap-2 border-t border-border pt-2 mt-1 text-xs text-text-secondary">
                        {p.eligibilityCriteria[0].minInterPercentage && (
                          <span>
                            Min Inter: {p.eligibilityCriteria[0].minInterPercentage}%
                          </span>
                        )}
                        {p.eligibilityCriteria[0].acceptedEntryTests.length > 0 && (
                          <span className="rounded bg-bg px-1.5 py-0.5 border border-border">
                            {p.eligibilityCriteria[0].acceptedEntryTests.join(", ")}
                          </span>
                        )}
                      </div>
                    )}

                    {p.university.annualFeePKR && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-text-secondary">Annual Fee</span>
                        <span className="font-semibold text-text">
                          PKR {p.university.annualFeePKR.toLocaleString("en-PK")}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
