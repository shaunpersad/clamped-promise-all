import assert from 'assert';
import { clampedAll, clampedAllSettled } from '../src/clampedPromiseAll';

describe('clamped-promise-all', () => {
  let numExecutions = 0;
  let maxExecutions = 0;
  const fulfilledPromise = <Value>(value: Value, timeout: number) => new Promise<Value>(
    (resolve) => {
      numExecutions++;
      if (numExecutions > maxExecutions) {
        maxExecutions = numExecutions;
      }
      setTimeout(() => {
        numExecutions--;
        resolve(value);
      }, timeout);
    });
  const rejectedPromise = (message: string, timeout: number) => new Promise(
    (resolve, reject) => {
      numExecutions++;
      if (numExecutions > maxExecutions) {
        maxExecutions = numExecutions;
      }
      setTimeout(() => {
        numExecutions--;
        reject(new Error(message));
      }, timeout);
    });
  const allFulfilledPromises = () => [
    () => fulfilledPromise('zero', 200),
    () => fulfilledPromise('one', 100),
    () => fulfilledPromise('two', 400),
    () => fulfilledPromise('three', 200),
  ];
  const someRejectedPromises = () => [
    () => fulfilledPromise('zero', 200),
    () => fulfilledPromise('one', 100),
    () => rejectedPromise('two', 300),
    () => fulfilledPromise('three', 400),
    () => fulfilledPromise('four', 200),
    () => rejectedPromise('five', 350),
  ];
  beforeEach(() => {
    numExecutions = 0;
    maxExecutions = 0;
  });
  describe('clampedAll', () => {
    it('executes an array of promises with a max number of parallel executions', async () => {
      const arr = allFulfilledPromises();
      const clamp = 2;
      const results = await clampedAll(arr, clamp);
      assert(maxExecutions === clamp);
      assert(results[0] === 'zero');
      assert(results[1] === 'one');
      assert(results[2] === 'two');
      assert(results[3] === 'three');
    });

    it('halts if a promise rejects', async () => {
      const arr = someRejectedPromises();
      const clamp = 2;
      const error = await clampedAll(arr, clamp).catch((err) => err);
      assert(maxExecutions === clamp);
      assert(error.message === 'two');
    });

    it('handles if the clamp is larger than the array', async () => {
      const arr = allFulfilledPromises();
      const clamp = arr.length + 1;
      const results = await clampedAll(arr, clamp);
      assert(maxExecutions === arr.length);
      assert(results[0] === 'zero');
      assert(results[1] === 'one');
      assert(results[2] === 'two');
      assert(results[3] === 'three');
    });

    it('handles if the clamp is the same as the array length', async () => {
      const arr = allFulfilledPromises();
      const clamp = arr.length;
      const results = await clampedAll(arr, clamp);
      assert(maxExecutions === arr.length);
      assert(results[0] === 'zero');
      assert(results[1] === 'one');
      assert(results[2] === 'two');
      assert(results[3] === 'three');
    });

    it('handles if the clamp is zero', async () => {
      const arr = allFulfilledPromises();
      const clamp = 0;
      const results = await clampedAll(arr, clamp);
      assert(maxExecutions === 0);
      assert(results.length === 0);
    });

    it('handles if there are no promises to execute', async () => {
      const clamp = 2;
      const results = await clampedAll([], clamp);
      assert(maxExecutions === 0);
      assert(results.length === 0);
    });

    it('handles if there is only one promise', async () => {
      const arr = allFulfilledPromises().slice(0, 1);
      const clamp = 2;
      const results = await clampedAll(arr, clamp);
      assert(maxExecutions === 1);
      assert(results.length === 1);
      assert(results[0] === 'zero');
    });

    it('handles non-promises', async () => {
      const arr = [
        () => 1,
        () => Promise.resolve(2),
        () => 3,
      ];
      const clamp = 1;
      const results = await clampedAll(arr, clamp);
      assert(results[0] === 1);
      assert(results[1] === 2);
      assert(results[2] === 3);
    });
  });

  describe('clampedAllSettled', () => {
    it('executes an array of promises with a max number of parallel executions', async () => {
      const arr = someRejectedPromises();
      const clamp = 2;
      const results = await clampedAllSettled(arr, clamp);
      assert(maxExecutions === clamp);
      assert(results[0].status === 'fulfilled' && results[0].value === 'zero');
      assert(results[1].status === 'fulfilled' && results[1].value === 'one');
      assert(results[2].status === 'rejected' && results[2].reason.message === 'two');
      assert(results[3].status === 'fulfilled' && results[3].value === 'three');
      assert(results[4].status === 'fulfilled' && results[4].value === 'four');
      assert(results[5].status === 'rejected' && results[5].reason.message === 'five');
    });

    it('handles if the clamp is larger than the array', async () => {
      const arr = someRejectedPromises();
      const clamp = arr.length + 1;
      const results = await clampedAllSettled(arr, clamp);
      assert(maxExecutions === arr.length);
      assert(results[0].status === 'fulfilled' && results[0].value === 'zero');
      assert(results[1].status === 'fulfilled' && results[1].value === 'one');
      assert(results[2].status === 'rejected' && results[2].reason.message === 'two');
      assert(results[3].status === 'fulfilled' && results[3].value === 'three');
      assert(results[4].status === 'fulfilled' && results[4].value === 'four');
      assert(results[5].status === 'rejected' && results[5].reason.message === 'five');
    });

    it('handles if the clamp is the same as the array length', async () => {
      const arr = someRejectedPromises();
      const clamp = arr.length;
      const results = await clampedAllSettled(arr, clamp);
      assert(maxExecutions === arr.length);
      assert(results[0].status === 'fulfilled' && results[0].value === 'zero');
      assert(results[1].status === 'fulfilled' && results[1].value === 'one');
      assert(results[2].status === 'rejected' && results[2].reason.message === 'two');
      assert(results[3].status === 'fulfilled' && results[3].value === 'three');
      assert(results[4].status === 'fulfilled' && results[4].value === 'four');
      assert(results[5].status === 'rejected' && results[5].reason.message === 'five');
    });

    it('handles if the clamp is zero', async () => {
      const arr = someRejectedPromises();
      const clamp = 0;
      const results = await clampedAllSettled(arr, clamp);
      assert(maxExecutions === 0);
      assert(results.length === 0);
    });

    it('handles if there are no promises to execute', async () => {
      const clamp = 2;
      const results = await clampedAllSettled([], clamp);
      assert(maxExecutions === 0);
      assert(results.length === 0);
    });

    it('handles if there is only one promise', async () => {
      const arr = someRejectedPromises().slice(0, 1);
      const clamp = 2;
      const results = await clampedAllSettled(arr, clamp);
      assert(maxExecutions === 1);
      assert(results[0].status === 'fulfilled' && results[0].value === 'zero');
    });

    it('handles non-promises', async () => {
      const arr = [
        () => 1,
        () => Promise.resolve(2),
        () => 3,
        () => {
          throw new Error('4');
        },
        () => 5,
        () => Promise.reject(new Error('6')),
      ];
      const clamp = 1;
      const results = await clampedAllSettled(arr, clamp);
      assert(results[0].status === 'fulfilled' && results[0].value === 1);
      assert(results[1].status === 'fulfilled' && results[1].value === 2);
      assert(results[2].status === 'fulfilled' && results[2].value === 3);
      assert(results[3].status === 'rejected' && results[3].reason.message === '4');
      assert(results[4].status === 'fulfilled' && results[4].value === 5);
      assert(results[5].status === 'rejected' && results[5].reason.message === '6');
    });
  });
});
