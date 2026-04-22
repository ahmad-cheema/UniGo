-- CreateTable
CREATE TABLE "University" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "established" INTEGER,
    "type" TEXT,
    "campuses" TEXT,
    "specialization" TEXT,
    "specializationDetail" TEXT,
    "programsOfferedRaw" TEXT,
    "acceptanceRate" DOUBLE PRECISION,
    "annualFeePKR" INTEGER,
    "studentFacultyRatio" TEXT,
    "rankingPakistan" INTEGER,
    "hecRecognized" BOOLEAN NOT NULL DEFAULT true,
    "applicationDeadline" TEXT,
    "entryTestRequired" TEXT,
    "hostelAvailable" BOOLEAN,
    "scholarshipAvailable" BOOLEAN,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityCriterion" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "minInterPercentage" DOUBLE PRECISION,
    "minEntryTestScore" DOUBLE PRECISION,
    "acceptedEntryTests" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "province" TEXT,
    "interests" TEXT[],
    "matricPercentage" DOUBLE PRECISION,
    "interPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestScore" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "testType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION,
    "examDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityMatchResult" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "universityId" INTEGER NOT NULL,
    "programId" INTEGER,
    "isEligible" BOOLEAN NOT NULL,
    "reasonCodes" TEXT[],
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "planJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");

-- CreateIndex
CREATE INDEX "University_province_idx" ON "University"("province");

-- CreateIndex
CREATE INDEX "University_entryTestRequired_idx" ON "University"("entryTestRequired");

-- CreateIndex
CREATE INDEX "University_rankingPakistan_idx" ON "University"("rankingPakistan");

-- CreateIndex
CREATE INDEX "Program_name_idx" ON "Program"("name");

-- CreateIndex
CREATE INDEX "Program_universityId_idx" ON "Program"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_universityId_name_key" ON "Program"("universityId", "name");

-- CreateIndex
CREATE INDEX "EligibilityCriterion_programId_idx" ON "EligibilityCriterion"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_email_key" ON "StudentProfile"("email");

-- CreateIndex
CREATE INDEX "TestScore_studentId_testType_idx" ON "TestScore"("studentId", "testType");

-- CreateIndex
CREATE INDEX "EligibilityMatchResult_studentId_idx" ON "EligibilityMatchResult"("studentId");

-- CreateIndex
CREATE INDEX "EligibilityMatchResult_universityId_idx" ON "EligibilityMatchResult"("universityId");

-- CreateIndex
CREATE INDEX "EligibilityMatchResult_programId_idx" ON "EligibilityMatchResult"("programId");

-- CreateIndex
CREATE INDEX "StudyPlan_studentId_idx" ON "StudyPlan"("studentId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestScore" ADD CONSTRAINT "TestScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityMatchResult" ADD CONSTRAINT "EligibilityMatchResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityMatchResult" ADD CONSTRAINT "EligibilityMatchResult_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityMatchResult" ADD CONSTRAINT "EligibilityMatchResult_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
