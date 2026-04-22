import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type CsvRow = {
  University: string;
  Location: string;
  Province: string;
  Established?: string;
  Type?: string;
  Campuses?: string;
  Specialization?: string;
  Specialization_Detail?: string;
  Programs_Offered?: string;
  "Acceptance_Rate_%"?: string;
  Annual_Fee_PKR?: string;
  Student_Faculty_Ratio?: string;
  Ranking_Pakistan?: string;
  HEC_Recognized?: string;
  Application_Deadline?: string;
  Entry_Test_Required?: string;
  Min_Entry_Test?: string;
  Hostel_Available?: string;
  Scholarship_Available?: string;
  Website?: string;
};

function toInt(v?: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toFloat(v?: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toBool(v?: string): boolean | null {
  if (!v || !v.trim()) return null;
  const s = v.trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
}

function clean(v?: string): string | null {
  if (!v) return null;
  const s = v.trim();
  return s.length ? s : null;
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "../data/pakistan_universities.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
    trim: true
  }) as CsvRow[];

  let importedUniversities = 0;
  let importedPrograms = 0;

  for (const row of rows) {
    const uniName = row.University?.trim();
    if (!uniName) continue;

    const entryTestRequired = clean(row.Entry_Test_Required) ?? clean(row.Min_Entry_Test);

    const university = await prisma.university.upsert({
      where: { name: uniName },
      update: {
        location: row.Location?.trim() ?? "",
        province: row.Province?.trim() ?? "",
        established: toInt(row.Established),
        type: clean(row.Type),
        campuses: clean(row.Campuses),
        specialization: clean(row.Specialization),
        specializationDetail: clean(row.Specialization_Detail),
        programsOfferedRaw: clean(row.Programs_Offered),
        acceptanceRate: toFloat(row["Acceptance_Rate_%"]),
        annualFeePKR: toInt(row.Annual_Fee_PKR),
        studentFacultyRatio: clean(row.Student_Faculty_Ratio),
        rankingPakistan: toInt(row.Ranking_Pakistan),
        hecRecognized: toBool(row.HEC_Recognized) ?? true,
        applicationDeadline: clean(row.Application_Deadline),
        entryTestRequired,
        hostelAvailable: toBool(row.Hostel_Available),
        scholarshipAvailable: toBool(row.Scholarship_Available),
        website: clean(row.Website)
      },
      create: {
        name: uniName,
        location: row.Location?.trim() ?? "",
        province: row.Province?.trim() ?? "",
        established: toInt(row.Established),
        type: clean(row.Type),
        campuses: clean(row.Campuses),
        specialization: clean(row.Specialization),
        specializationDetail: clean(row.Specialization_Detail),
        programsOfferedRaw: clean(row.Programs_Offered),
        acceptanceRate: toFloat(row["Acceptance_Rate_%"]),
        annualFeePKR: toInt(row.Annual_Fee_PKR),
        studentFacultyRatio: clean(row.Student_Faculty_Ratio),
        rankingPakistan: toInt(row.Ranking_Pakistan),
        hecRecognized: toBool(row.HEC_Recognized) ?? true,
        applicationDeadline: clean(row.Application_Deadline),
        entryTestRequired,
        hostelAvailable: toBool(row.Hostel_Available),
        scholarshipAvailable: toBool(row.Scholarship_Available),
        website: clean(row.Website)
      }
    });

    importedUniversities += 1;

    const programs = (row.Programs_Offered ?? "")
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    await prisma.program.deleteMany({ where: { universityId: university.id } });

    if (programs.length > 0) {
      await prisma.program.createMany({
        data: programs.map((name) => ({
          universityId: university.id,
          name
        })),
        skipDuplicates: true
      });
      importedPrograms += programs.length;
    }
  }

  console.log(`Imported universities: ${importedUniversities}`);
  console.log(`Imported programs: ${importedPrograms}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
