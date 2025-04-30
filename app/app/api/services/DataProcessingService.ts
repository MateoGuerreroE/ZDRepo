import { DataSource } from "../types/abstract";
import { DomainDataProcessor } from "./DomainDataProcessor";
import { ProcessedData } from "../types";

export class DataProcessingService {
  constructor(private readonly dataSource: DataSource) {}

  async processData(): Promise<ProcessedData[]> {
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
}
