import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcceptedSubmission } from "@/lib/codeforces";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { handle, handles, problemId } = body;

        const handlesToCheck: string[] = handles || (handle ? [handle] : []);

        if (handlesToCheck.length === 0 || !problemId) {
            return NextResponse.json(
                { error: "Handle(s) and problemId are required" },
                { status: 400 }
            );
        }

        const problem = await prisma.dailyProblem.findUnique({
            where: { id: parseInt(problemId) },
        });

        if (!problem) {
            return NextResponse.json(
                { error: "Problem not found" },
                { status: 404 }
            );
        }

        const postedAtSeconds = Math.floor(problem.postedAt.getTime() / 1000);
        const TWENTY_FOUR_HOURS = 24 * 60 * 60;
        const deadlineSeconds = postedAtSeconds + TWENTY_FOUR_HOURS;

        let validSubmission = null;
        let successfulHandle = null;

        for (const handleToCheck of handlesToCheck) {
            const existingSubmission = await prisma.submission.findUnique({
                where: {
                    userHandle_problemId: {
                        userHandle: handleToCheck,
                        problemId: parseInt(problemId),
                    },
                },
            });

            if (existingSubmission) {
                return NextResponse.json(
                    { error: `Handle "${handleToCheck}" has already verified this problem` },
                    { status: 400 }
                );
            }

            const submission = await getAcceptedSubmission(
                handleToCheck,
                problem.cfContestId,
                problem.cfIndex,
                postedAtSeconds
            );

            if (submission && submission.solveTimeSeconds <= deadlineSeconds) {
                validSubmission = submission;
                successfulHandle = handleToCheck;
                break;
            }
        }

        if (!validSubmission || !successfulHandle) {
            return NextResponse.json(
                {
                    error:
                        "No valid submission found for any of the provided handles. Make sure at least one handle solved the problem within 24 hours of posting.",
                },
                { status: 404 }
            );
        }

        await prisma.user.upsert({
            where: { handle: successfulHandle },
            create: { handle: successfulHandle },
            update: {},
        });

        await prisma.submission.create({
            data: {
                userHandle: successfulHandle,
                problemId: parseInt(problemId),
                timeTaken: validSubmission.timeTakenSeconds,
            },
        });

        const allSubmissions = await prisma.submission.findMany({
            where: { problemId: parseInt(problemId) },
            orderBy: { timeTaken: "asc" },
        });

        const affectedUsers = new Set(allSubmissions.map(s => s.userHandle));

        for (const userHandle of affectedUsers) {
            const userSubmissions = await prisma.submission.findMany({
                where: { userHandle },
            });

            const totalPenalty = userSubmissions.reduce(
                (sum, sub) => sum + sub.timeTaken,
                0
            );

            await prisma.user.update({
                where: { handle: userHandle },
                data: {
                    totalSolved: userSubmissions.length,
                    totalPenalty,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Solution verified successfully!",
            handle: successfulHandle,
            rank: allSubmissions.findIndex(s => s.userHandle === successfulHandle) + 1,
            timeTaken: validSubmission.timeTakenSeconds,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
