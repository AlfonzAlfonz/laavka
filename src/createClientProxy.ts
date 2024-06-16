import { nanoid } from "nanoid";
import { SerializedError } from "./SerializedError";
import {
	BridgeInitRequest,
	BridgeRequest,
	BridgeRequestType,
	BridgeResponse,
	BridgeResponseType,
	BridgeReturnType,
	BridgeSubRequestType,
	DEFAULT_CHANNEL,
} from "./bridgeTypes";
import { ejectedPromise } from "./utils/ejectedPromise";
import { asyncIterableIterator } from "./utils/asyncIterableIterator";
import { Unreachable } from "./utils/errors";

interface ClientProxyOptions<TCh extends string> {
	channel?: TCh;
	postMessage: (req: BridgeRequest<unknown[], TCh>) => unknown;
}

/**
 * return tuple of a Proxy object with the same interface as the bridge and
 * function used to handle responses from the other side of the bridge
 * @param postMessage function used to send out the requests
 * @returns
 */
export const createClientProxy = <
	TBridge extends object,
	TCh extends string = typeof DEFAULT_CHANNEL,
>({
	channel,
	postMessage,
}: ClientProxyOptions<TCh>): [
	bridge: TBridge,
	responseHandler: (
		response: BridgeResponse<BridgeReturnType<TBridge>, TCh>,
	) => void,
] => {
	channel = channel ?? (DEFAULT_CHANNEL as TCh);
	const listeners = new Map<string, Listener>();

	const sendRequest = (
		req: Omit<BridgeInitRequest<unknown[], TCh>, "channel">,
	) => {
		postMessage({
			...req,
			channel,
		});
	};

	return [
		_deepProxy([], sendRequest, (id, listener) => listeners.set(id, listener)),
		(response) => {
			if (listeners.has(response.id)) {
				const [resolve, reject] = listeners.get(response.id)!;
				listeners.delete(response.id);

				// types might not match, but because it's guaranteed that server with send valid response with matching id
				switch (response.type) {
					case BridgeResponseType.Response:
					case BridgeResponseType.ResponseIteratorNext:
					case BridgeResponseType.ResponseFunctionReturn:
						resolve(response.result as never);
						return;
					case BridgeResponseType.Error:
						reject(SerializedError.fromJSON(response.error));
						return;
					case BridgeResponseType.ResponseIterator:
						resolve(
							asyncIterableIterator({
								next: (value?: unknown) => {
									postMessage({
										type: BridgeRequestType.SubRequest,
										channel,
										id: response.id,
										subRequest: BridgeSubRequestType.AsyncIteratorNext,
										value,
									});

									const [promise, ...listener] =
										ejectedPromise<IteratorResult<unknown>>();
									listeners.set(response.id, listener);
									return promise;
								},
							}) satisfies AsyncIterator<unknown> as never,
						);
						return;
					case BridgeResponseType.ResponseFunction:
						resolve(((...args: any[]) => {
							postMessage({
								type: BridgeRequestType.SubRequest,
								channel,
								id: response.id,
								subRequest: "function-call",
								args,
							} as never);

							const [promise, ...listener] = ejectedPromise();
							listeners.set(response.id, listener);
							return promise;
						}) as never);
						return;
					default:
						// @ts-expect-error
						Unreachable.throw(`Invalid response type ${response.type}`);
				}
			} else {
				throw new Error(`Missing listener for id: ${response.id}`);
			}
		},
	];
};

const func = () => {};

const _deepProxy = <TBridge extends object>(
	base: string[],
	sendRequest: (
		req: Omit<BridgeInitRequest<unknown[], string>, "channel">,
	) => unknown,
	registerListener: (id: string, listener: Listener) => unknown,
): TBridge =>
	new Proxy<TBridge>(func as TBridge, {
		get: (_, key) => {
			if (typeof key === "symbol") throw new Error("Symbols are not supported");

			return _deepProxy([...base, key], sendRequest, registerListener);
		},
		apply: (_, __, args: unknown[]) => {
			const id = createGuid();

			sendRequest({
				type: BridgeRequestType.Request,
				id,
				path: base,
				args,
			});

			return new Promise((resolve, reject) => {
				registerListener(id, [resolve, reject]);
			});
		},
	});

type Listener = [resolve: (x: never) => void, reject: (e: unknown) => void];

const createGuid = () => nanoid();
