import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return istDate.toISOString().split('T')[0];
}

export async function GET() {
    try {
        const now = new Date();

        const problems = await prisma.dailyProblem.findMany({
            where: {
                postedAt: {
                    lte: now,
                },
            },
            orderBy: {
                postedAt: 'desc',
            },
        });

        const grouped: Record<string, typeof problems> = {};

        problems.forEach((problem) => {
            const dateKey = formatDate(problem.postedAt);
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(problem);
        });

        return NextResponse.json(grouped);
    } catch (error) {
        console.error("Error fetching problems:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
