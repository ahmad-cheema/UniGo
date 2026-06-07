"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heading, Text } from "@/components/ui/typography";

type University = {
  id: number;
  name: string;
  location: string;
  province: string;
  established: number | null;
  type: string | null;
  annualFeePKR: number | null;
  rankingPakistan: number | null;
  hecRecognized: boolean;
  entryTestRequired: string | null;
  hostelAvailable: boolean | null;
  scholarshipAvailable: boolean | null;
  website: string | null;
  programs: Array<{ id: number }>;
};

type Program = {
  id: number;
  universityId: number;
  name: string;
  description: string | null;
  university: { id: number; name: string };
};

type Criterion = {
  id: number;
  programId: number;
  minMatricPercentage: number | null;
  minInterPercentage: number | null;
  minEntryTestScore: number | null;
  acceptedEntryTests: string[];
  requiredSubjects: string[];
  isActive: boolean;
  program: {
    id: number;
    name: string;
    university: { id: number; name: string };
  };
};

interface Props {
  universities: University[];
  programs: Program[];
  criteria: Criterion[];
}

function listToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminClient({ universities, programs, criteria }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"universities" | "programs" | "criteria">("universities");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [uniId, setUniId] = useState("");
  const [uniName, setUniName] = useState("");
  const [uniLocation, setUniLocation] = useState("");
  const [uniProvince, setUniProvince] = useState("");
  const [uniType, setUniType] = useState("");
  const [uniFee, setUniFee] = useState("");
  const [uniRank, setUniRank] = useState("");
  const [uniEntryTest, setUniEntryTest] = useState("");
  const [uniWebsite, setUniWebsite] = useState("");
  const [uniHec, setUniHec] = useState(true);
  const [uniHostel, setUniHostel] = useState(false);
  const [uniScholarship, setUniScholarship] = useState(false);

  const [programId, setProgramId] = useState("");
  const [programUniversityId, setProgramUniversityId] = useState(
    universities[0]?.id.toString() ?? ""
  );
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");

  const [criterionId, setCriterionId] = useState("");
  const [criterionProgramId, setCriterionProgramId] = useState(
    programs[0]?.id.toString() ?? ""
  );
  const [minMatric, setMinMatric] = useState("50");
  const [minInter, setMinInter] = useState("50");
  const [minTest, setMinTest] = useState("50");
  const [acceptedTests, setAcceptedTests] = useState("University Own Test");
  const [requiredSubjects, setRequiredSubjects] = useState("");
  const [criterionActive, setCriterionActive] = useState(true);

  function editUniversity(uni: University) {
    setUniId(String(uni.id));
    setUniName(uni.name);
    setUniLocation(uni.location);
    setUniProvince(uni.province);
    setUniType(uni.type ?? "");
    setUniFee(uni.annualFeePKR?.toString() ?? "");
    setUniRank(uni.rankingPakistan?.toString() ?? "");
    setUniEntryTest(uni.entryTestRequired ?? "");
    setUniWebsite(uni.website ?? "");
    setUniHec(uni.hecRecognized);
    setUniHostel(uni.hostelAvailable ?? false);
    setUniScholarship(uni.scholarshipAvailable ?? false);
  }

  function editProgram(program: Program) {
    setProgramId(String(program.id));
    setProgramUniversityId(String(program.universityId));
    setProgramName(program.name);
    setProgramDescription(program.description ?? "");
  }

  function editCriterion(item: Criterion) {
    setCriterionId(String(item.id));
    setCriterionProgramId(String(item.programId));
    setMinMatric(item.minMatricPercentage?.toString() ?? "");
    setMinInter(item.minInterPercentage?.toString() ?? "");
    setMinTest(item.minEntryTestScore?.toString() ?? "");
    setAcceptedTests(item.acceptedEntryTests.join(", "));
    setRequiredSubjects(item.requiredSubjects.join(", "));
    setCriterionActive(item.isActive);
  }

  async function saveJson(url: string, body: unknown) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Save failed");
        return;
      }
      setMessage("Saved successfully.");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(url: string) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Delete failed");
        return;
      }
      setMessage("Deleted successfully.");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function submitUniversity(e: React.FormEvent) {
    e.preventDefault();
    await saveJson("/api/admin/universities", {
      ...(uniId ? { id: Number(uniId) } : {}),
      name: uniName,
      location: uniLocation,
      province: uniProvince,
      type: uniType || null,
      annualFeePKR: uniFee ? Number(uniFee) : null,
      rankingPakistan: uniRank ? Number(uniRank) : null,
      hecRecognized: uniHec,
      entryTestRequired: uniEntryTest || null,
      hostelAvailable: uniHostel,
      scholarshipAvailable: uniScholarship,
      website: uniWebsite || null,
    });
  }

  async function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    await saveJson("/api/admin/programs", {
      ...(programId ? { id: Number(programId) } : {}),
      universityId: Number(programUniversityId),
      name: programName,
      description: programDescription || null,
    });
  }

  async function submitCriterion(e: React.FormEvent) {
    e.preventDefault();
    await saveJson("/api/admin/eligibility-criteria", {
      ...(criterionId ? { id: Number(criterionId) } : {}),
      programId: Number(criterionProgramId),
      minMatricPercentage: minMatric ? Number(minMatric) : null,
      minInterPercentage: minInter ? Number(minInter) : null,
      minEntryTestScore: minTest ? Number(minTest) : null,
      acceptedEntryTests: listToArray(acceptedTests),
      requiredSubjects: listToArray(requiredSubjects),
      isActive: criterionActive,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {(["universities", "programs", "criteria"] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === name
                ? "bg-primary text-white"
                : "border border-border bg-white text-text-secondary hover:text-text"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-primary" : "text-error"}`}>
          {message}
        </p>
      )}

      {tab === "universities" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <Card>
            <Heading as="h3" className="mb-4">
              {uniId ? "Edit University" : "Add University"}
            </Heading>
            <form onSubmit={submitUniversity} className="flex flex-col gap-3">
              <Input id="uni-name" label="Name" value={uniName} onChange={(e) => setUniName(e.target.value)} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input id="uni-location" label="Location" value={uniLocation} onChange={(e) => setUniLocation(e.target.value)} required />
                <Input id="uni-province" label="Province" value={uniProvince} onChange={(e) => setUniProvince(e.target.value)} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input id="uni-type" label="Type" value={uniType} onChange={(e) => setUniType(e.target.value)} />
                <Input id="uni-entry" label="Entry Test" value={uniEntryTest} onChange={(e) => setUniEntryTest(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input id="uni-fee" label="Annual Fee" type="number" value={uniFee} onChange={(e) => setUniFee(e.target.value)} />
                <Input id="uni-rank" label="Ranking" type="number" value={uniRank} onChange={(e) => setUniRank(e.target.value)} />
              </div>
              <Input id="uni-website" label="Website" value={uniWebsite} onChange={(e) => setUniWebsite(e.target.value)} />
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={uniHec} onChange={(e) => setUniHec(e.target.checked)} /> HEC</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={uniHostel} onChange={(e) => setUniHostel(e.target.checked)} /> Hostel</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={uniScholarship} onChange={(e) => setUniScholarship(e.target.checked)} /> Scholarship</label>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save University"}</Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <Heading as="h3" className="mb-4">Universities</Heading>
            <table className="w-full text-sm">
              <tbody>
                {universities.map((uni) => (
                  <tr key={uni.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-text">{uni.name}</p>
                      <Text variant="secondary" size="sm" className="text-xs">{uni.location}, {uni.province} - {uni.programs.length} programs</Text>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => editUniversity(uni)} className="mr-4 text-xs font-medium text-primary hover:underline">Edit</button>
                      <button onClick={() => deleteItem(`/api/admin/universities?id=${uni.id}`)} className="text-xs font-medium text-error hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "programs" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <Card>
            <Heading as="h3" className="mb-4">{programId ? "Edit Program" : "Add Program"}</Heading>
            <form onSubmit={submitProgram} className="flex flex-col gap-3">
              <select value={programUniversityId} onChange={(e) => setProgramUniversityId(e.target.value)} className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm">
                {universities.map((uni) => <option key={uni.id} value={uni.id}>{uni.name}</option>)}
              </select>
              <Input id="program-name" label="Program Name" value={programName} onChange={(e) => setProgramName(e.target.value)} required />
              <Input id="program-desc" label="Description" value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} />
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Program"}</Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <Heading as="h3" className="mb-4">Programs</Heading>
            <table className="w-full text-sm">
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-text">{program.name}</p>
                      <Text variant="secondary" size="sm" className="text-xs">{program.university.name}</Text>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => editProgram(program)} className="mr-4 text-xs font-medium text-primary hover:underline">Edit</button>
                      <button onClick={() => deleteItem(`/api/admin/programs?id=${program.id}`)} className="text-xs font-medium text-error hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "criteria" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <Card>
            <Heading as="h3" className="mb-4">{criterionId ? "Edit Criteria" : "Add Criteria"}</Heading>
            <form onSubmit={submitCriterion} className="flex flex-col gap-3">
              <select value={criterionProgramId} onChange={(e) => setCriterionProgramId(e.target.value)} className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm">
                {programs.map((program) => <option key={program.id} value={program.id}>{program.name} - {program.university.name}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input id="crit-matric" label="Matric %" type="number" value={minMatric} onChange={(e) => setMinMatric(e.target.value)} />
                <Input id="crit-inter" label="Inter %" type="number" value={minInter} onChange={(e) => setMinInter(e.target.value)} />
                <Input id="crit-test" label="Test %" type="number" value={minTest} onChange={(e) => setMinTest(e.target.value)} />
              </div>
              <Input id="crit-tests" label="Accepted Tests" value={acceptedTests} onChange={(e) => setAcceptedTests(e.target.value)} />
              <Input id="crit-subjects" label="Required Subjects" value={requiredSubjects} onChange={(e) => setRequiredSubjects(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={criterionActive} onChange={(e) => setCriterionActive(e.target.checked)} />
                Active
              </label>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Criteria"}</Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <Heading as="h3" className="mb-4">Eligibility Criteria</Heading>
            <table className="w-full text-sm">
              <tbody>
                {criteria.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-text">{item.program.name}</p>
                      <Text variant="secondary" size="sm" className="text-xs">
                        {item.program.university.name} - Matric {item.minMatricPercentage ?? "-"}%, Inter {item.minInterPercentage ?? "-"}%, Tests {item.acceptedEntryTests.join(", ") || "None"}
                      </Text>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => editCriterion(item)} className="mr-4 text-xs font-medium text-primary hover:underline">Edit</button>
                      <button onClick={() => deleteItem(`/api/admin/eligibility-criteria?id=${item.id}`)} className="text-xs font-medium text-error hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
