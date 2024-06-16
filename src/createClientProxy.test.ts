import { createTestClientServerBridge } from "./_utils.test";
import {
	BridgeInitRequest,
	BridgeRequestType,
	BridgeResponse,
	BridgeSubRequest,
} from "./bridgeTypes";
import {
	isBridgeInitRequest,
	isBridgeResponse,
	isBridgeSubRequest,
} from "./validations";

class TestBridge {
	async add(a: number, b: number) {
		return a + b;
	}
}

test("should send requests and responses", async () => {
	const requests: BridgeInitRequest<unknown[], "default">[] = [];
	const subRequests: BridgeSubRequest<"default">[] = [];
	const responses: BridgeResponse<unknown, "default">[] = [];
	const [bridge, target] = createTestClientServerBridge(new TestBridge());

	target.addEventListener("clientToServer", (e) => {
		const detail: unknown = (e as CustomEvent).detail;
		if (isBridgeInitRequest(detail)) {
			requests.push(detail);
		} else if (isBridgeSubRequest(detail)) {
			subRequests.push(detail);
		}
	});

	target.addEventListener("serverToClient", (e) => {
		const detail: unknown = (e as CustomEvent).detail;
		if (isBridgeResponse(detail)) {
			responses.push(detail);
		}
	});

	expect(await bridge.add(1, 4)).toBe(5);

	expect(requests.length).toBe(1);
	expect(requests[0]!.type).toBe(BridgeRequestType.Request);
	expect(requests[0]!.path).toMatchObject(["add"]);
	expect(requests[0]!.args).toMatchObject([1, 4]);

	expect(responses.length).toBe(1);
	expect(responses[0]!.type).toBe("response");
	expect((responses[0] as any).result).toBe(5);

	expect(requests[0]!.id).toBe(responses[0]!.id);
});
