"use client";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { IScoreResult } from "./api/types/scoring";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useJobProcess } from "./useJobProcess";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [errorResult, setErrorResult] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<IScoreResult[]>([]);
  const [loading, isLoading] = useState<boolean>(false);

  const [pollingFunction, buttonDisabled] = useJobProcess();

  const handleRequestComplete = () => {
    setProgress(100);
    setTimeout(() => isLoading(false), 500);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 15000); // every 15 seconds
    }

    return () => clearInterval(interval);
  }, [loading]);

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
      let api: Response;
      if (csvFile) {
        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("jobDescription", jobDescription);
        api = await fetch("/api/score", {
          method: "POST",
          body: formData,
          cache: "no-cache",
        });
      } else {
        api = await fetch("/api/score", {
          method: "POST",
          body: JSON.stringify({ jobDescription }),
          headers: { "Content-Type": "application/json" },
          cache: "no-cache",
        });
      }

      if (!api.ok) {
        const message =
          "There was an error processing your request. Try again later.";
        setErrorResult(message);
        return;
      }
      const { data } = await api.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        const result = await pollingFunction(
          "/api/status",
          data.candidates,
          data.jobId
        );

        setResults(result);
      }
    } catch (e) {
      const message = (e as Error).message || "Unknown error";
      setErrorResult(message);
    } finally {
      handleRequestComplete();
    }
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setError("");
    } else {
      setError("Invalid file. Please select a valid CSV file.");
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
                className="h-[100%]"
                value={jobDescription}
                onChange={(value) => setJobDescription(value.target.value)}
              />
              <p className="mt-1 text-red-800">{error}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs">
                You can use your own candidate base, If no file is uploaded,
                candidates in storage will be used
              </p>
              <Input type="file" onChange={handleFilePick} />
            </div>
            <Button
              disabled={
                (!jobDescription.length || jobDescription.length < 30) &&
                !buttonDisabled
              }
              className="hover:cursor-pointer"
              onClick={() => handleSubmit()}
            >
              Generate ranking
            </Button>
          </div>
        </div>
        <div className="w-1/2 px-8">
          <h3 className="text-xl font-sans font-semibold mb-3">Results:</h3>
          <div className="w-full border-1 border-zinc-200 shadow-xl rounded-2xl h-[500px] flex">
            {loading ? (
              <div className="p-5 flex items-center justify-center h-32 w-full gap-3 flex-col">
                <p className="text-lg">
                  This may take a while. You should go grab a coffee :)
                </p>
                <p className="text-lg">Loading...</p>
                <Progress value={progress} />
              </div>
            ) : results.length ? (
              <div className="w-full h-full overflow-y-scroll p-2">
                <Accordion type="single" collapsible className="w-full">
                  {results.map((result, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border-b-2 border-zinc-200 font-sans"
                    >
                      <AccordionTrigger className="text-lg font-semibold flex flex-row">
                        <p>
                          {index + 1}) {result.candidateName}
                        </p>
                        <p>Score: {result.generalScoring}</p>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-zinc-600 gap-1 flex flex-col">
                        <p>
                          <b>Candidate Id:</b> {result.candidateId}
                        </p>
                        <p>
                          <b>Highlights:</b> {result.highlights}
                        </p>
                        <p>
                          <b>Detailed scoring:</b>
                        </p>
                        {Object.entries(result.scoringDetails).map(
                          ([key, value]) => (
                            <p key={`${index}-${key}`}>
                              {key}: {value}
                            </p>
                          )
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="p-5 italic">
                {errorResult ? (
                  <p className="text-red-800">
                    Error: {errorResult}. Did this happened after a long wait?
                    Give It a second try! Sometimes jobs stall (we are solving
                    that) but processed results are stored.
                  </p>
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
