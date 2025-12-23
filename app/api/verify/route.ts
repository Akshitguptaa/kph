import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcceptedSubmission } from "@/lib/codeforces";

export async function POST(request: NextRequest) {
    try {
        const { handle, problemId } = await request.json();

        if (!handle || !problemId) {
            return NextResponse.json(
                { error: "Handle and problemId are required" },
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

        const existingSubmission = await prisma.submission.findUnique({
            where: {
                userHandle_problemId: {
                    userHandle: handle,
                    problemId: parseInt(problemId),
                },
            },
        });

        if (existingSubmission) {
            return NextResponse.json(
                { error: "You have already verified this problem" },
                { status: 400 }
            );
        }

        const postedAtSeconds = Math.floor(problem.postedAt.getTime() / 1000);
        const submission = await getAcceptedSubmission(
            handle,
            problem.cfContestId,
            problem.cfIndex,
            postedAtSeconds
        );

        if (!submission) {
            return NextResponse.json(
                {
                    error:
                        "No valid submission found. Make sure you solved the problem after it was posted and have an OK verdict.",
                },
                { status: 404 }
            );
        }

        const TWENTY_FOUR_HOURS = 24 * 60 * 60;
        const deadlineSeconds = postedAtSeconds + TWENTY_FOUR_HOURS;

        if (submission.solveTimeSeconds > deadlineSeconds) {
            const hoursLate = Math.floor((submission.solveTimeSeconds - deadlineSeconds) / 3600);
            return NextResponse.json(
                {
                    error: `Submission is outside the 24-hour window. You submitted ${hoursLate} hour(s) after the deadline.`,
                },
                { status: 400 }
            );
        }

        await prisma.user.upsert({
            where: { handle },
            create: { handle },
            update: {},
        });

        await prisma.submission.create({
            data: {
                userHandle: handle,
                problemId: parseInt(problemId),
                timeTaken: submission.timeTakenSeconds,
                dailyRank: 0,
            },
        });

        const allSubmissions = await prisma.submission.findMany({
            where: { problemId: parseInt(problemId) },
            orderBy: { timeTaken: "asc" },
        });

        for (let i = 0; i < allSubmissions.length; i++) {
            await prisma.submission.update({
                where: { id: allSubmissions[i].id },
                data: { dailyRank: i + 1 },
            });
        }

        const affectedUsers = new Set(allSubmissions.map((s: { userHandle: string }) => s.userHandle));

        for (const userHandle of affectedUsers) {
            const userSubmissions = await prisma.submission.findMany({
                where: { userHandle },
            });

            const totalRank = userSubmissions.reduce(
                (sum: number, sub: { dailyRank: number }) => sum + sub.dailyRank,
                0
            );
            const avgRank = totalRank / userSubmissions.length;

            await prisma.user.update({
                where: { handle: userHandle },
                data: {
                    avgRank,
                    totalSolved: userSubmissions.length,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Solution verified successfully!",
            rank: allSubmissions.findIndex((s: { userHandle: string }) => s.userHandle === handle) + 1,
            timeTaken: submission.timeTakenSeconds,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
