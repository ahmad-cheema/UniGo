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

type AcademicRecord = {
  id: number;
  level: string;
  subject: string;
  marksObtained: number | null;
  totalMarks: number | null;
  grade: string | null;
  percentage: number | null;
  examBoard: string | null;
  examYear: number | null;
};

type AcademicDocument = {
  id: number;
  title: string;
  level: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

type Profile = {
  id: number;
  fullName: string;
  email: string;
  province: string | null;
  interests: string[];
  matricPercentage: number | null;
  interPercentage: number | null;
  academicRecords: AcademicRecord[];
  academicDocuments: AcademicDocument[];
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

  const [recordLevel, setRecordLevel] = useState("Intermediate");
  const [recordSubject, setRecordSubject] = useState("");
  const [recordMarks, setRecordMarks] = useState("");
  const [recordTotal, setRecordTotal] = useState("");
  const [recordGrade, setRecordGrade] = useState("");
  const [recordBoard, setRecordBoard] = useState("");
  const [recordYear, setRecordYear] = useState("");
  const [recordMsg, setRecordMsg] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docLevel, setDocLevel] = useState("Intermediate");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMsg, setDocMsg] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    setSavingRecord(true);
    setRecordMsg("");

    try {
      const res = await fetch("/api/students/me/academic-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: recordLevel,
          subject: recordSubject,
          marksObtained: recordMarks ? Number(recordMarks) : null,
          totalMarks: recordTotal ? Number(recordTotal) : null,
          grade: recordGrade || null,
          examBoard: recordBoard || null,
          examYear: recordYear ? Number(recordYear) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRecordMsg(data.error ?? "Failed to add academic record");
        return;
      }

      setRecordMsg("Academic record added!");
      setRecordSubject("");
      setRecordMarks("");
      setRecordTotal("");
      setRecordGrade("");
      setRecordBoard("");
      setRecordYear("");
      router.refresh();
    } catch {
      setRecordMsg("Something went wrong. Please try again.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleDeleteRecord(id: number) {
    await fetch(`/api/students/me/academic-records/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docFile) return;

    setUploadingDoc(true);
    setDocMsg("");

    try {
      const form = new FormData();
      form.set("title", docTitle || docFile.name);
      form.set("level", docLevel);
      form.set("file", docFile);

      const res = await fetch("/api/students/me/academic-records", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        setDocMsg(data.error ?? "Failed to upload document");
        return;
      }

      setDocMsg("Document uploaded!");
      setDocTitle("");
      setDocFile(null);
      router.refresh();
    } catch {
      setDocMsg("Something went wrong. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDeleteDocument(id: number) {
    await fetch(`/api/students/me/documents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const completionItems = [
    { label: "Province", done: !!profile.province },
    { label: "Matric %", done: profile.matricPercentage !== null },
    { label: "Inter %", done: profile.interPercentage !== null },
    { label: "Subject Records", done: profile.academicRecords.length > 0 },
    { label: "Marksheets", done: profile.academicDocuments.length > 0 },
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Heading as="h3" className="mb-4">
            Subject Records
          </Heading>

          {profile.academicRecords.length === 0 ? (
            <Text variant="secondary" size="sm">
              Add subject-level marks so eligibility can check required
              subjects such as Mathematics, Biology, Chemistry, or English.
            </Text>
          ) : (
            <div className="mb-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-text-secondary">Level</th>
                    <th className="pb-2 font-medium text-text-secondary">Subject</th>
                    <th className="pb-2 font-medium text-text-secondary">Score</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {profile.academicRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 text-text-secondary">{record.level}</td>
                      <td className="py-2 pr-3 font-medium text-text">{record.subject}</td>
                      <td className="py-2 pr-3 text-text-secondary">
                        {record.percentage !== null
                          ? `${record.percentage}%`
                          : record.grade ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-xs font-medium text-error hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form onSubmit={handleAddRecord} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="record-level" className="text-sm font-medium text-text">
                  Level
                </label>
                <select
                  id="record-level"
                  value={recordLevel}
                  onChange={(e) => setRecordLevel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Matric">Matric</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="A-Level">A-Level</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Input
                id="record-subject"
                label="Subject"
                placeholder="e.g. Mathematics"
                value={recordSubject}
                onChange={(e) => setRecordSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                id="record-marks"
                label="Marks"
                type="number"
                min={0}
                step={0.1}
                value={recordMarks}
                onChange={(e) => setRecordMarks(e.target.value)}
              />
              <Input
                id="record-total"
                label="Total"
                type="number"
                min={1}
                step={0.1}
                value={recordTotal}
                onChange={(e) => setRecordTotal(e.target.value)}
              />
              <Input
                id="record-grade"
                label="Grade"
                placeholder="A"
                value={recordGrade}
                onChange={(e) => setRecordGrade(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="record-board"
                label="Board"
                placeholder="BISE Lahore"
                value={recordBoard}
                onChange={(e) => setRecordBoard(e.target.value)}
              />
              <Input
                id="record-year"
                label="Exam Year"
                type="number"
                min={1950}
                max={2100}
                value={recordYear}
                onChange={(e) => setRecordYear(e.target.value)}
              />
            </div>

            {recordMsg && (
              <p className={`text-sm ${recordMsg.includes("added") ? "text-primary" : "text-error"}`}>
                {recordMsg}
              </p>
            )}
            <Button type="submit" variant="secondary" disabled={savingRecord}>
              {savingRecord ? "Adding..." : "Add Academic Record"}
            </Button>
          </form>
        </Card>

        <Card>
          <Heading as="h3" className="mb-4">
            Marksheets
          </Heading>

          {profile.academicDocuments.length === 0 ? (
            <Text variant="secondary" size="sm">
              Upload small PDF or image marksheets for the academic record
              storage requirement.
            </Text>
          ) : (
            <div className="mb-5 flex flex-col gap-2">
              {profile.academicDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{doc.title}</p>
                    <p className="text-xs text-text-secondary">
                      {doc.level ?? "Document"} · {(doc.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/api/students/me/documents/${doc.id}/download`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-xs font-medium text-error hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleUploadDocument} className="flex flex-col gap-3">
            <Input
              id="doc-title"
              label="Document Title"
              placeholder="Intermediate marksheet"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-level" className="text-sm font-medium text-text">
                Level
              </label>
              <select
                id="doc-level"
                value={docLevel}
                onChange={(e) => setDocLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Matric">Matric</option>
                <option value="Intermediate">Intermediate</option>
                <option value="A-Level">A-Level</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
              required
            />
            {docMsg && (
              <p className={`text-sm ${docMsg.includes("uploaded") ? "text-primary" : "text-error"}`}>
                {docMsg}
              </p>
            )}
            <Button type="submit" disabled={uploadingDoc || !docFile}>
              {uploadingDoc ? "Uploading..." : "Upload Marksheet"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
