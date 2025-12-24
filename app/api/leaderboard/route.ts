import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 20;
        const skip = (page - 1) * pageSize;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
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
                skip,
                take: pageSize,
            }),
            prisma.user.count({
                where: {
                    totalSolved: {
                        gt: 0,
                    },
                },
            }),
        ]);

        return NextResponse.json({
            users,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
