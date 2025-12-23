interface CodeforcesSubmission {
    id: number;
    contestId: number;
    creationTimeSeconds: number;
    problem: {
        contestId: number;
        index: string;
        name: string;
    };
    verdict: string;
    programmingLanguage: string;
}

interface CodeforcesResponse {
    status: string;
    result?: CodeforcesSubmission[];
    comment?: string;
}

export interface ValidSubmission {
    submissionId: number;
    solveTimeSeconds: number;
    timeTakenSeconds: number;
}

export async function getAcceptedSubmission(
    handle: string,
    contestId: number,
    index: string,
    postedAtSeconds: number
): Promise<ValidSubmission | null> {
    try {
        const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`;
        const response = await fetch(url, { next: { revalidate: 0 } });

        if (!response.ok) return null;

        const data: CodeforcesResponse = await response.json();
        if (data.status !== "OK" || !data.result) return null;

        const validSubmissions = data.result.filter(
            (submission) =>
                submission.problem.contestId === contestId &&
                submission.problem.index === index &&
                submission.verdict === "OK" &&
                submission.creationTimeSeconds >= postedAtSeconds
        );

        if (validSubmissions.length === 0) return null;

        const earliestSubmission = validSubmissions.reduce((earliest, current) =>
            current.creationTimeSeconds < earliest.creationTimeSeconds ? current : earliest
        );

        return {
            submissionId: earliestSubmission.id,
            solveTimeSeconds: earliestSubmission.creationTimeSeconds,
            timeTakenSeconds: earliestSubmission.creationTimeSeconds - postedAtSeconds,
        };
    } catch (error) {
        return null;
    }
}

export async function validateHandle(handle: string): Promise<boolean> {
    try {
        const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
        const response = await fetch(url, { next: { revalidate: 3600 } });

        if (!response.ok) return false;

        const data: CodeforcesResponse = await response.json();
        return data.status === "OK";
    } catch (error) {
        return false;
    }
}
