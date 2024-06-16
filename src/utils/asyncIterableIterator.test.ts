import { asyncIterableIterator } from "./asyncIterableIterator";

const getIterator = (): AsyncIterator<number> => {
	let i = 0;
	return {
		next: async () => {
			if (i === 0) {
				i++;
				return { value: 1, done: false };
			} else {
				return { value: undefined, done: true };
			}
		},
	};
};

test("asyncIterableIterator", async () => {
	const result = [];
	for await (const v of asyncIterableIterator(getIterator())) {
		result.push(v);
	}
	expect(result).toMatchObject([1]);
});
