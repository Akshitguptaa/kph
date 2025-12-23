import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                totalSolved: {
                    gt: 0,
                },
            },
            orderBy: [{ avgRank: "asc" }, { totalSolved: "desc" }],
            select: {
                handle: true,
                avgRank: true,
                totalSolved: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
