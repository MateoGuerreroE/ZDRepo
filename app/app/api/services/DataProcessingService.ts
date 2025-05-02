import { DataSource } from "../types/abstract";
import { DomainDataProcessor } from "./DomainDataProcessor";
import { Candidate, ProcessedData } from "../types";

export class DataProcessingService {
  constructor(private readonly dataSource: DataSource) {}

  async processDataWithJD(): Promise<ProcessedData[]> {
    const data = await this.dataSource.getDataWithCache({ debug: true });
    const jobsMap = DomainDataProcessor.getJobsMap(data);
    const processedCandidates =
      DomainDataProcessor.getProcessedCandidates(data);

    const processedData: ProcessedData[] = Array.from(jobsMap.entries()).map(
      ([jobName, jobData]) => ({
        job: jobName,
        jobDescription: jobData.jobDescription,
        candidates: processedCandidates.filter(
          (candidate) => candidate.jobApplied === jobName
        ),
      })
    );

    return processedData;
  }

  async processCandidates(): Promise<Candidate[]> {
    const data = await this.dataSource.getDataWithCache({ debug: true });
    const processedCandidates =
      DomainDataProcessor.getProcessedCandidates(data);
    return processedCandidates;
  }
}
