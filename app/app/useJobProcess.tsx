import { useRef, useState } from "react";
import { Candidate } from "./api/types";
import { IScoreResult } from "./api/types/scoring";

export type PollingFunction = (
  endpoint: string,
  candidates: Candidate[],
  jobId: string
) => Promise<IScoreResult[]>;

export function useJobProcess(): [PollingFunction, boolean] {
  const retriesRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const startPolling = async (
    endpoint: string,
    candidates: Candidate[],
    jobId: string
  ): Promise<IScoreResult[]> => {
    setButtonDisabled(true);
    if (intervalRef.current) throw new Error("Polling already in progress");

    retriesRef.current = 0; // Reset on each trigger
    const maxRetries = 18;
    const delay = 15000;
    const retryStatusCode = 202;

    return new Promise((resolve, reject) => {
      const handleFinish = (data?: IScoreResult[], message?: string) => {
        clearInterval(intervalRef.current!);
        setButtonDisabled(false);
        intervalRef.current = null;
        return !data ? reject(new Error(message)) : resolve(data);
      };

      const checkStatus = async () => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            body: JSON.stringify({ jobId, candidates }),
            headers: { "Content-Type": "application/json" },
            cache: "no-cache",
          });

          console.log(res);

          if (res.status === 200) {
            const { data } = await res.json();
            return handleFinish(data);
          }

          if (res.status === retryStatusCode) {
            console.log("Polling in progress...");
            retriesRef.current += 1;
          } else {
            const data = await res.json();
            return handleFinish(undefined, data.message);
          }

          if (retriesRef.current >= maxRetries) {
            handleFinish();
          }
        } catch {
          return handleFinish();
        }
      };

      intervalRef.current = setInterval(checkStatus, delay);
      checkStatus();
    });
  };

  return [startPolling, buttonDisabled];
}
