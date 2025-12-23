-- CreateTable
CREATE TABLE "users" (
    "handle" TEXT NOT NULL,
    "avgRank" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("handle")
);

-- CreateTable
CREATE TABLE "daily_problems" (
    "id" SERIAL NOT NULL,
    "cfContestId" INTEGER NOT NULL,
    "cfIndex" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "dailyRank" INTEGER NOT NULL,
    "userHandle" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");

-- CreateIndex
CREATE INDEX "daily_problems_postedAt_idx" ON "daily_problems"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_problems_cfContestId_cfIndex_key" ON "daily_problems"("cfContestId", "cfIndex");

-- CreateIndex
CREATE INDEX "submissions_problemId_timeTaken_idx" ON "submissions"("problemId", "timeTaken");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_userHandle_problemId_key" ON "submissions"("userHandle", "problemId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userHandle_fkey" FOREIGN KEY ("userHandle") REFERENCES "users"("handle") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "daily_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
