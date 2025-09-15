import { v4 as uuidv4 } from "uuid";
import {
  JobStatus,
  RegressionModelType,
  Resolvers,
  PointInput,
} from "./generated/graphql";

const jobs = new Map<string, any>();
const models = new Map<string, any>();

const delayMs = 60 * 1000;

function regressionModelSimulation(
  jobId: string,
  points: PointInput[],
  modelType: RegressionModelType,
  alpha?: number | null
) {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error("Job is not found!");
  }

  if (!points || points.length === 0) {
    throw new Error("points required!");
  }

  if (
    (modelType === RegressionModelType.Lasso ||
      modelType === RegressionModelType.Ridge) &&
    alpha !== null
  ) {
    //check alpha is positive float
    if (alpha! <= 0 || Number.isNaN(alpha)) {
      throw new Error("alpha must be positive float!");
    }
  }

  job.status = JobStatus.Running;
  job.startedAt = new Date().toISOString();
  jobs.set(jobId, job);

  setTimeout(() => {
    try {
      const modelId = uuidv4();
      const model = {
        id: modelId,
        modelType,
        alpha: modelType === RegressionModelType.Linear ? null : alpha,
        trainedAt: new Date().toISOString(),
        meta: `regression fitting - ${points.length} points`,
      };
      models.set(modelId, model);

      job.status = JobStatus.Completed;
      job.finishedAt = new Date().toISOString();
      job.resultModelId = modelId;
      jobs.set(jobId, job);
    } catch (err: any) {
      job.status = JobStatus.Failed;
      job.finishedAt = new Date().toISOString();
      job.error = err?.message ?? "unknown error";
      jobs.set(jobId, job);
    }
  }, delayMs);
}

export const resolvers: Resolvers = {
  Query: {
    job: (_parent, { id }) => jobs.get(id) ?? null,
    model: (_parent, { id }) => models.get(id) ?? null,
  },
  Mutation: {
    startJob: (_parent, { points, modelType, alpha }) => {
      const jobId = uuidv4();
      const job = {
        id: jobId,
        status: JobStatus.Queued,
      };
      jobs.set(jobId, job);

      regressionModelSimulation(jobId, points, modelType, alpha);
      return job;
    },
    predict: (_parent, { modelId, x }) => {
      const model = models.get(modelId);
      if (!model) {
        throw new Error("Model not found");
      }
      return x + 1;
    },
  },
};
