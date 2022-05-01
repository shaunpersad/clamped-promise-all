export type SettledReturnType<Value, Reason> = {
  status: 'fulfilled',
  value: Value,
} | {
  status: 'rejected',
  reason: Reason,
};

/**
 * Clamped alternative to Promise.all.
 */
export function clampedAll<Value>(
  arr: Array<() => Promise<Value> | Value>,
  clamp: number,
): Promise<Value[]> {
  const { length } = arr;
  const maxExecutions = Math.min(length, clamp);
  return maxExecutions === 0 ? Promise.resolve([]) : new Promise((resolve, reject) => {
    const results: Value[] = Array.from({ length });
    let numExecutions = 0;
    let numResults = 0;
    let isFinished = false;
    const execute = () => {
      const index = numExecutions++;
      return Promise.resolve()
        .then(() => arr[index]())
        .then((result) => {
          numResults++;
          if (!isFinished) {
            results[index] = result;
            if (numExecutions < length) {
              void execute();
            } else if (numResults === length) {
              isFinished = true;
              resolve(results);
            }
          }
        })
        .catch((err) => {
          if (!isFinished) {
            isFinished = true;
            reject(err);
          }
        });
    };
    while (numExecutions < maxExecutions) void execute();
  });
}

/**
 * Clamped alternative to Promise.allSettled.
 */
export function clampedAllSettled<Value, Reason = Error>(
  arr: Array<() => Promise<Value> | Value>,
  clamp: number,
): Promise<SettledReturnType<Value, Reason>[]> {
  const { length } = arr;
  const maxExecutions = Math.min(length, clamp);
  return maxExecutions === 0 ? Promise.resolve([]) : new Promise((resolve) => {
    const results: SettledReturnType<Value, Reason>[] = Array.from({ length });
    let numExecutions = 0;
    let numResults = 0;
    const execute = () => {
      const index = numExecutions++;
      return Promise.resolve()
        .then(() => arr[index]())
        .then((result) => {
          results[index] = { status: 'fulfilled', value: result };
        })
        .catch((err) => {
          results[index] = { status: 'rejected', reason: err };
        })
        .then(() => {
          numResults++;
          if (numExecutions < length) void execute();
          else if (numResults === length) resolve(results);
        });
    };
    while (numExecutions < maxExecutions) void execute();
  });
}
