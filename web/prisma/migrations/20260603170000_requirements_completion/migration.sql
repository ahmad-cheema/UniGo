-- Requirements completion: academic records, stored marksheets, richer criteria.

ALTER TABLE "Program" ADD COLUMN "description" TEXT;

ALTER TABLE "EligibilityCriterion" ADD COLUMN "minMatricPercentage" DOUBLE PRECISION;
ALTER TABLE "EligibilityCriterion" ADD COLUMN "requiredSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "EligibilityCriterion" ALTER COLUMN "requiredSubjects" DROP DEFAULT;

CREATE TABLE "AcademicRecord" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "grade" TEXT,
    "percentage" DOUBLE PRECISION,
    "examBoard" TEXT,
    "examYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicDocument" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicRecord_studentId_idx" ON "AcademicRecord"("studentId");
CREATE INDEX "AcademicRecord_level_subject_idx" ON "AcademicRecord"("level", "subject");
CREATE INDEX "AcademicDocument_studentId_idx" ON "AcademicDocument"("studentId");

ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
