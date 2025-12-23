import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        if (!file.name.endsWith(".txt")) {
            return NextResponse.json(
                { error: "Only .txt files are allowed" },
                { status: 400 }
            );
        }

        const text = await file.text();
        const handles = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (handles.length === 0) {
            return NextResponse.json(
                { error: "File is empty or contains no valid handles" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            handles,
            count: handles.length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process file" },
            { status: 500 }
        );
    }
}
