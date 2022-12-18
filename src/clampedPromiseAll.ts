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
export async function clampedAll<Value>(
  arr: Array<() => Promise<Value> | Value>,
  clamp: number,
): Promise<Value[]> {
  const { length } = arr;
  const maxExecutions = Math.min(length, clamp);
  const executions = [...arr];
  const results: Value[] = [];
  if (!maxExecutions) return Promise.resolve(results);
  await Promise.all(
    Array.from({ length: maxExecutions }).map(async () => {
      while (executions.length) {
        const index = length - executions.length;
        const execution = executions.shift();
        if (execution) {
          results[index] = await execution();
        }
      }
    }),
  );
  return results;
}

/**
 * Clamped alternative to Promise.allSettled.
 */
export async function clampedAllSettled<Value, Reason = Error>(
  arr: Array<() => Promise<Value> | Value>,
  clamp: number,
): Promise<SettledReturnType<Value, Reason>[]> {
  const { length } = arr;
  const maxExecutions = Math.min(length, clamp);
  const executions = [...arr];
  const results: SettledReturnType<Value, Reason>[] = [];
  if (!maxExecutions) return Promise.resolve(results);
  await Promise.all(
    Array.from({ length: maxExecutions }).map(async () => {
      while (executions.length) {
        const index = length - executions.length;
        const execution = executions.shift();
        if (execution) {
          try {
            results[index] = { status: 'fulfilled', value: await execution() };
          } catch (err) {
            results[index] = { status: 'rejected', reason: err };
          }
        }
      }
    }),
  );
  return results;
}
