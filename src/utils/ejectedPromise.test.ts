import { ejectedPromise } from "./ejectedPromise";

test("ejectedPromise", async () => {
	const [promise, resolve] = ejectedPromise();

	resolve(undefined);
	await promise;
});
