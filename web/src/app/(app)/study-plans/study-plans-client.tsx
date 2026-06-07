"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

type Target = {
  programId: number;
  universityId: number;
  label: string;
};

type PlanJson = {
  title?: string;
  summary?: string;
  weeklyPlan?: Array<{ week?: string; goals?: string[]; tasks?: string[] }>;
  focusAreas?: string[];
  resources?: string[];
  milestones?: string[];
  cautions?: string[];
};

type StudyPlan = {
  id: number;
  modelName: string;
  promptVersion: string;
  planJson: PlanJson;
  generatedAt: string;
};

interface Props {
  targets: Target[];
  studyPlans: StudyPlan[];
}

function renderList(items?: string[]) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function StudyPlansClient({ targets, studyPlans }: Props) {
  const router = useRouter();
  const [selectedTarget, setSelectedTarget] = useState(targets[0]?.programId.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generatePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const target = targets.find((item) => item.programId === Number(selectedTarget));
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target
            ? { programId: target.programId, universityId: target.universityId }
            : {}
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to generate study plan");
        return;
      }
      setMessage("Study plan generated.");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={generatePlan} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="target" className="mb-1.5 block text-sm font-medium text-text">
              Target Program
            </label>
            <select
              id="target"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none"
            >
              {targets.length === 0 && <option value="">Use profile and latest matches</option>}
              {targets.map((target) => (
                <option key={`${target.programId}-${target.universityId}`} value={target.programId}>
                  {target.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate AI Plan"}
          </Button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${message.includes("generated") ? "text-primary" : "text-error"}`}>
            {message}
          </p>
        )}
      </Card>

      {studyPlans.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3">
          <Heading as="h3">No study plans yet</Heading>
          <Text variant="secondary" size="sm" className="max-w-md text-center">
            Run an eligibility check first for better targeting, then generate
            a study plan from your current academic profile.
          </Text>
        </Card>
      ) : (
        studyPlans.map((plan) => {
          const json = plan.planJson ?? {};
          return (
            <Card key={plan.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Heading as="h3">{json.title ?? "Study Plan"}</Heading>
                  <Text variant="secondary" size="sm">
                    {json.summary ?? "Generated preparation guidance."}
                  </Text>
                  <p className="text-xs text-text-secondary">
                    {plan.modelName} - {new Date(plan.generatedAt).toLocaleString("en-PK")}
                  </p>
                </div>

                {json.weeklyPlan && json.weeklyPlan.length > 0 && (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {json.weeklyPlan.map((week, index) => (
                      <div key={`${week.week}-${index}`} className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold text-text">
                          {week.week ?? `Week ${index + 1}`}
                        </p>
                        {renderList([...(week.goals ?? []), ...(week.tasks ?? [])])}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Focus Areas</p>
                    {renderList(json.focusAreas)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">Milestones</p>
                    {renderList(json.milestones)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">Resources</p>
                    {renderList(json.resources)}
                  </div>
                </div>

                {json.cautions && json.cautions.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-text">Cautions</p>
                    {renderList(json.cautions)}
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
