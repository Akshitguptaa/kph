"use client";

import { useState, useEffect } from "react";
import { Clock, ExternalLink, Star, ChevronDown, ChevronRight } from "lucide-react";

interface DailyProblem {
  id: number;
  cfContestId: number;
  cfIndex: string;
  title: string;
  postedAt: string;
}

interface GroupedProblems {
  [date: string]: DailyProblem[];
}

interface LeaderboardEntry {
  handle: string;
  avgRank: number;
  totalSolved: number;
  avgTimeOfAC?: number;
}

export default function Home() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    problemId: number;
  } | null>(null);
  const [groupedProblems, setGroupedProblems] = useState<GroupedProblems>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    fetchServerTime();

    const interval = setInterval(() => {
      if (serverTime) {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTime]);

  const fetchData = async () => {
    try {
      Promise.all([fetchProblems(), fetchLeaderboard()]);
    } catch (error) {
    }
  };

  const fetchServerTime = async () => {
    try {
      const res = await fetch("/api/time");
      if (res.ok) {
        const data = await res.json();
        setServerTime(new Date(data.timestamp));
        setCurrentTime(new Date(data.timestamp));
      }
    } catch (error) {
      setServerTime(new Date());
      setCurrentTime(new Date());
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await fetch("/api/problems");
      if (res.ok) {
        const data: GroupedProblems = await res.json();
        setGroupedProblems(data);
      }
    } catch (error) {
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
    }
  };

  const handleVerify = async (problemId: number) => {
    if (!handle.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your Codeforces handle",
        problemId,
      });
      return;
    }

    setLoading(problemId);
    setMessage(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), problemId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Verified! Your rank: #${data.rank} (${formatTime(data.timeTaken)})`,
          problemId,
        });
        setHandle("");
        await fetchLeaderboard();
      } else {
        setMessage({ type: "error", text: data.error || "Verification failed", problemId });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again.", problemId });
    } finally {
      setLoading(null);
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getTimeRemaining = (postedAt: string) => {
    if (!currentTime) return "Loading...";

    const posted = new Date(postedAt);
    const deadline = new Date(posted.getTime() + 24 * 60 * 60 * 1000);
    const diff = Math.floor((deadline.getTime() - currentTime.getTime()) / 1000);

    if (diff <= 0) return "Deadline passed";
    return `${formatTime(diff)} remaining`;
  };

  const isDeadlinePassed = (postedAt: string) => {
    if (!currentTime) return false;

    const posted = new Date(postedAt);
    const deadline = new Date(posted.getTime() + 24 * 60 * 60 * 1000);
    return currentTime > deadline;
  };

  const formatCurrentTime = () => {
    if (!currentTime) return "Loading...";

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    };
    return currentTime.toLocaleTimeString('en-US', options) + " IST";
  };

  const renderStars = (count: number) => {
    return Array.from({ length: Math.min(count, 10) }).map((_, i) => (
      <Star key={i} className="inline w-3 h-3 fill-[#ffff66] text-[#ffff66]" />
    ));
  };

  const allProblems: DailyProblem[] = [];
  Object.values(groupedProblems).forEach(problems => {
    allProblems.push(...problems);
  });

  const activeProblems = allProblems
    .filter(p => !isDeadlinePassed(p.postedAt))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  const dates = Object.keys(groupedProblems).sort().reverse();

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 py-12 sm:px-8 md:px-12 lg:px-16">
      <div className="w-full">

        <div className="w-full flex flex-col lg:flex-row justify-between gap-12 items-start">
          <div className="flex-1 w-full max-w-7xl space-y-16">

            <header className="text-center space-y-6 relative">
              <pre
                className="text-[#00cc00] text-sm sm:text-base md:text-lg leading-tight font-medium"
                style={{ fontFamily: "inherit" }}
              >
                {`
 ██╗  ██╗ ██████╗  ██╗  ██╗
 ██║ ██╔╝ ██╔══██╗ ██║  ██║
 █████╔╝  ██████╔╝ ███████║
 ██╔═██╗  ██╔═══╝  ██╔══██║
 ██║  ██╗ ██║      ██║  ██║
 ╚═╝  ╚═╝ ╚═╝      ╚═╝  ╚═╝
                `}
              </pre>
              <h1 className="text-2xl text-[#cccccc] tracking-wide">
                Daily Competitive Programming Tracker
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-[#666666]">
                <Clock className="w-4 h-4" />
                <span>Server Time: {formatCurrentTime()}</span>
              </div>
              <div className="h-px w-32 mx-auto bg-[#666666]"></div>
            </header>

            <section className="space-y-4">
              <div className="space-y-3 pl-4">
                <label htmlFor="handle" className="block text-[#cccccc]">
                  Enter your Codeforces Handle:
                </label>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g., tourist"
                  disabled={loading !== null}
                  className="w-full max-w-md bg-transparent border border-[#666666] px-4 py-3 text-[#cccccc] placeholder-[#666666] focus:border-[#00cc00] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-[#00cc00] text-xl border-b border-[#333333] pb-3">
                --- Today's Challenge ---
              </h2>

              {activeProblems.length > 0 ? (
                <div className="space-y-6 pl-4">
                  {activeProblems.map((problem) => (
                    <div key={problem.id} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-[#666666]">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeRemaining(problem.postedAt)}</span>
                        </div>
                        <h3 className="text-[#ffff66] text-lg font-medium">
                          {problem.cfContestId}{problem.cfIndex}. {problem.title}
                        </h3>
                      </div>

                      <a
                        href={`https://codeforces.com/problemset/problem/${problem.cfContestId}/${problem.cfIndex}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#009900] hover:text-[#99ff99] hover:translate-x-1 transform transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>[ View Problem on Codeforces ]</span>
                      </a>

                      <div className="space-y-4 pt-4">
                        <button
                          onClick={() => handleVerify(problem.id)}
                          disabled={loading === problem.id || !handle.trim()}
                          className="text-[#009900] hover:text-[#99ff99] hover:translate-x-1 transform transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading === problem.id
                            ? "[ Verifying... ]"
                            : "[ Verify Solution ]"}
                        </button>


                        {message && message.problemId === problem.id && (
                          <div
                            className={`pl-4 py-2 border-l-2 ${message.type === "success"
                              ? "border-[#00cc00] text-[#00cc00]"
                              : "border-[#ff0000] text-[#ff9999]"
                              }`}
                          >
                            {message.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#666666] pl-4">
                  No active problems. Check back soon!
                </p>
              )}
            </section>

            <section className="space-y-8">
              <h2 className="text-[#00cc00] text-xl border-b border-[#333333] pb-3">
                --- Leaderboard ---
              </h2>

              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[#00cc00]">
                        <th className="pb-4 pr-6">Rank</th>
                        <th className="pb-4 pr-6">Handle</th>
                        <th className="pb-4 pr-6">Avg Rank</th>
                        <th className="pb-4 pr-6">Solved</th>
                        <th className="pb-4">Stars</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#cccccc]">
                      {leaderboard.map((entry, index) => (
                        <tr
                          key={entry.handle}
                          className="border-t border-[#333333] hover:bg-[#1a1a2e] transition-colors"
                        >
                          <td className="py-3 pr-6">
                            {index === 0 ? (
                              <span className="text-[#ffff66] font-bold">
                                #{index + 1}
                              </span>
                            ) : (
                              `#${index + 1}`
                            )}
                          </td>
                          <td className="py-3 pr-6">
                            <a
                              href={`https://codeforces.com/profile/${entry.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#009900] hover:text-[#99ff99] transition-colors"
                            >
                              {entry.handle}
                            </a>
                          </td>
                          <td className="py-3 pr-6 font-medium">
                            {entry.avgRank.toFixed(2)}
                          </td>
                          <td className="py-3 pr-6">{entry.totalSolved}</td>
                          <td className="py-3">{renderStars(entry.totalSolved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#666666] pl-4">
                  No submissions yet. Be the first!
                </p>
              )}
            </section>
          </div>

          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <section className="space-y-6 lg:sticky lg:top-8">
              <h2 className="text-[#00cc00] text-xl border-b border-[#333333] pb-3">
                --- Archive ---
              </h2>

              {dates.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {dates.map((date) => {
                    const isExpanded = expandedDates.has(date);
                    const problems = groupedProblems[date];

                    return (
                      <div key={date} className="space-y-2">
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full flex items-center gap-2 text-[#00cc00] hover:text-[#99ff99] transition-colors text-left text-sm"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span>{formatDateHeader(date)}</span>
                          <span className="text-xs text-[#666666]">
                            ({problems.length})
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="pl-5 space-y-2">
                            {problems.map((problem) => {
                              const deadlinePassed = isDeadlinePassed(problem.postedAt);

                              return (
                                <div key={problem.id} className="text-sm">
                                  <a
                                    href={`https://codeforces.com/problemset/problem/${problem.cfContestId}/${problem.cfIndex}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#009900] hover:text-[#99ff99] transition-colors block"
                                  >
                                    {problem.cfContestId}{problem.cfIndex}. {problem.title}
                                  </a>
                                  {!deadlinePassed && (
                                    <span className="text-xs text-[#666666]">
                                      {getTimeRemaining(problem.postedAt)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#666666] text-sm">
                  No archived problems yet.
                </p>
              )}
            </section>
          </div>

        </div>
      </div>

      <footer className="text-center text-[#666666] text-sm pt-12 pb-6 mt-16 border-t border-[#333333]">
        <p>Knuth Programming Hub</p>
      </footer>
    </div>
  );
}