import { NextResponse } from "next/server";

export async function GET() {
    try {
        const now = new Date();

        return NextResponse.json({
            timestamp: now.toISOString(),
            unix: Math.floor(now.getTime() / 1000),
        });
    } catch (error) {
        console.error("Error getting server time:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
