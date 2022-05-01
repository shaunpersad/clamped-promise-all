# clamped-promise-all
Executes an array of promises with a max number of parallel executions.

This library contains two functions, `clampedAll` which behaves similar to [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), and `clampedAllSettled` which behaves similar to [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).

Useful for situations where you may only make a specified number of parallel promises at a given time, e.g. [Cloudflare Workers](https://developers.cloudflare.com/workers/platform/limits/#simultaneous-open-connections).

## Installation
```shell
npm install clamped-promise-all
```

## Usage
1) `require` or `import` the version you need:
```javascript
const { clampedAll, clampedAllSettled } = require('clamped-promise-all');
```

```javascript
import { clampedAll, clampedAllSettled } from 'clamped-promise-all';
```

2) Pass an array of functions that return promises, along with the maximum level of parallelization:
```javascript
import { clampedAll } from 'clamped-promise-all';

const apiCalls = [
    () => fetch('https://api.github.com/search/repositories?q=clamped-promise-all'),
    () => fetch('https://api.github.com/search/repositories?q=throttled-queue'),
    () => fetch('https://api.github.com/search/repositories?q=sql-where-parser'),
    () => fetch('https://api.github.com/search/repositories?q=tokenize-this'),
];
const apiResponses = await clampedAll(apiCalls, 2); // make at most 2 api calls in parallel
```
`clampedAllSettled` works in exactly the same way as `clampedAll`, except its behavior and return type matches `Promise.allSettled`, in that it will not reject if a promise rejects.

### Take note
Unlike `Promise.all`, `clampedAll` requires an array of _functions_ that return promises, **not** an array of promises themselves!

Here's a typical "real-world" map example to further illustrate the difference:
```javascript
import { clampedAll } from 'clamped-promise-all';

const repos = ['clamped-promise-all', 'throttled-queue', 'sql-where-parser', 'tokenize-this'];
const apiCalls = repos.map(
    (repo) => () => fetch(`https://api.github.com/search/repositories?q=${repo}`),
);
const apiResponses = await clampedAll(apiCalls, 2); // make at most 2 api calls in parallel
```
Note that the repo name is not mapped to the `fetch` call directly, but is instead mapped to a wrapper function that then invokes the `fetch`.

## Typescript support
The package is written in Typescript and includes types by default. Both `clampedAll` and `clampedAllSettled` are generic, and in most cases will automatically use the input array's types to create it's output type.

However, you may also specify the array item type when needed:
```typescript
import { clampedAll } from 'clamped-promise-all';
const apiCalls = [
  () => fetch('https://api.github.com/search/repositories?q=clamped-promise-all'),
  () => fetch('https://api.github.com/search/repositories?q=throttled-queue'),
  () => fetch('https://api.github.com/search/repositories?q=sql-where-parser'),
  () => fetch('https://api.github.com/search/repositories?q=tokenize-this'),
];
const apiResponses = await clampedAll<GithubSearchResponse>(apiCalls, 2); // apiResponses is now typed as GithubSearchResponse[]
```
