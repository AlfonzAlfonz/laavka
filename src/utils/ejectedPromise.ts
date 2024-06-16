export const ejectedPromise = <T>() => {
	let [resolve, reject]: [(v: T) => void, (e: unknown) => void] = [
		null!,
		null!,
	];

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return [promise, resolve, reject] as const;
};

export const lock = () => ejectedPromise<void>();
