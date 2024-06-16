import { createClientProxy } from "./createClientProxy";
import { ResponseServer } from "./ResponseServer";
import { isBridgeRequest, isBridgeResponse } from "./validations";

export const createTestClientServerBridge = <T extends object>(bridge: T) => {
	const server = new ResponseServer(bridge);

	// Client side which may post requests to the server and receive events
	const initClientSide = (
		postMessage: (msg: unknown) => unknown,
		responseTarget: BridgeEventTarget,
	) => {
		const [bridge, responseHandler] = createClientProxy<T>({ postMessage });

		responseTarget.addEventListener("serverToClient", (e) => {
			const detail: unknown = (e as CustomEvent).detail;
			if (isBridgeResponse(detail)) {
				responseHandler(detail);
			}
		});

		return bridge;
	};

	// Server side which receives requests and posts responses to them
	const initServerSide = (
		postMessage: (msg: unknown) => unknown,
		requestTarget: BridgeEventTarget,
	) => {
		requestTarget.addEventListener("clientToServer", async (e) => {
			const detail: unknown = (e as CustomEvent).detail;
			if (isBridgeRequest(detail)) {
				postMessage(await server.createResponse(detail));
			}
		});
	};

	const messageTarget: BridgeEventTarget = new EventTarget();

	const requestToServer = (req: unknown) =>
		messageTarget.dispatchEvent(
			new CustomEvent("clientToServer", { detail: req }),
		);

	const respondToClient = (res: unknown) =>
		messageTarget.dispatchEvent(
			new CustomEvent("serverToClient", { detail: res }),
		);

	const proxyBridge = initClientSide(requestToServer, messageTarget);
	initServerSide(respondToClient, messageTarget);

	return [proxyBridge, messageTarget] as const;
};

interface BridgeEventTarget extends EventTarget {
	addEventListener(
		event: "serverToClient" | "clientToServer",
		cb: (e: Event) => unknown,
	): void;
}
