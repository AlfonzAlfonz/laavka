export type Prettify<T> = {
	[K in keyof T]: T[K];
};

export type Awaitable<T> = T | PromiseLike<T>;

export type AsyncIterableish<T> = AsyncIterable<T> | AsyncIterator<T>;
