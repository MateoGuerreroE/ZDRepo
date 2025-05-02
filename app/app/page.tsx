"use client";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useState } from "react";
import { IScoreResult } from "./api/types/scoring";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [errorResult, setErrorResult] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<IScoreResult[]>([]);
  const [loading, isLoading] = useState<boolean>(true);

  const handleSubmit = async () => {
    if (!jobDescription || jobDescription.length > 200) {
      setError(
        "Invalid job description. Job Description must be less than 200 characters"
      );
      return;
    }
    if (error) setError("");

    isLoading(true);
    setProgress(10);
    try {
      const api = await fetch("/api/score", {
        method: "POST",
        body: JSON.stringify({ jobDescription }),
        headers: { "Content-Type": "application/json" },
        cache: "no-cache",
      });

      const { data } = await api.json();

      console.log(data);

      setResults(data);
    } catch (e) {
      const message = (e as Error).message || "Unknown error";
      setErrorResult(message);
    } finally {
      setTimeout(() => setProgress(90), 800);
      isLoading(false);
    }
  };

  return (
    <main className="bg-zinc-400 flex flex-col gap-12 p-7 min-h-screen items-center justify-center">
      <h1 className="font-mono text-5xl font-bold">ZD Challenge!</h1>
      <div className="flex flex-row w-full max-w-[1200px]">
        <div className="flex flex-col w-1/2 px-8">
          <h3 className="text-xl font-sans font-semibold mb-5">
            Job Description:
          </h3>
          <div className="flex flex-col gap-5 h-64">
            <div className="h-full">
              <Textarea
                className="h-[90%]"
                value={jobDescription}
                onChange={(value) => setJobDescription(value.target.value)}
              />
              <p className="mt-1 text-red-800">{error}</p>
            </div>
            <Button
              disabled={!jobDescription.length || jobDescription.length < 30}
              className="hover:cursor-pointer"
              onClick={() => handleSubmit()}
            >
              Press me!
            </Button>
          </div>
        </div>
        <div className="w-1/2 px-8">
          <h3 className="text-xl font-sans font-semibold mb-3">Results:</h3>
          <div className="w-full border-1 border-zinc-200 shadow-xl rounded-2xl h-[500px] flex">
            {loading ? (
              <div className="p-5 flex items-center justify-center h-32 w-full">
                <Progress value={progress} />
              </div>
            ) : results.length ? (
              <></>
            ) : (
              <div className="p-5 italic">
                {errorResult ? (
                  <p className="text-red-800">{errorResult}</p>
                ) : (
                  <p className="text-center">
                    There are no results yet. Load a job description, press the
                    button and prepare to be amazed!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
