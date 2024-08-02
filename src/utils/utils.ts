import exportFromJSON, { ExportType } from "export-from-json";

export async function fulfillWithTimeLimit(
  timeLimit: number,
  task: () => void,
  failureValue: any
): Promise<any> {
  let timeout;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeout = setTimeout(() => {
      resolve(failureValue);
    }, timeLimit);
  });
  const response = await Promise.race([task, timeoutPromise]);
  if (timeout) {
    //the code works without this but let's be safe and clean up the timeout
    clearTimeout(timeout);
  }
  return response;
}

export async function throwErrorAfterTimeout(
  timeLimit: number,
  task: () => Promise<any>,
  errorMessage: string
): Promise<any> {
  let timeout;

  // Create a promise that rejects with an error after the time limit
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeLimit);
  });

  try {
    // Use Promise.race to run the task with the timeout
    const response = await Promise.race([task(), timeoutPromise]);
    return response;
  } finally {
    // Clean up the timeout to avoid memory leaks
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export const generateCSV = (data: object, fileName: string = "download") => {
  const exportType: ExportType = exportFromJSON.types.csv;

  const result = exportFromJSON({
    data,
    fileName,
    exportType,
  });

  return result;
};
