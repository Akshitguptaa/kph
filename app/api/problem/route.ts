import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const problem = await prisma.dailyProblem.findFirst({
            orderBy: { postedAt: "desc" },
        });

        if (!problem) {
            return NextResponse.json(
                { error: "No active problem found" },
                { status: 404 }
            );
        }

        return NextResponse.json(problem);
    } catch (error) {
        console.error("Error fetching problem:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
