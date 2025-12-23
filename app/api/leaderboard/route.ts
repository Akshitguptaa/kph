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
            orderBy: [
                { totalSolved: "desc" },
                { totalPenalty: "asc" },
            ],
            select: {
                handle: true,
                totalSolved: true,
                totalPenalty: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
