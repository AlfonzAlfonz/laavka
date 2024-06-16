import {
	BridgeInitRequest,
	BridgeRequest,
	BridgeRequestType,
	BridgeResponse,
	BridgeResponseType,
	BridgeReturnType,
	BridgeSubRequest,
	DEFAULT_CHANNEL,
} from "./bridgeTypes";

export const isBridgeRequest = <TCh extends string = typeof DEFAULT_CHANNEL>(
	x: unknown,
	channel: TCh = DEFAULT_CHANNEL as TCh,
): x is BridgeRequest<unknown[], TCh> =>
	isBridgeInitRequest(x, channel) || isBridgeSubRequest(x, channel);

export const isBridgeInitRequest = <
	TCh extends string = typeof DEFAULT_CHANNEL,
>(
	x: unknown,
	channel: TCh = DEFAULT_CHANNEL as TCh,
): x is BridgeInitRequest<unknown[], TCh> =>
	!!x &&
	typeof x === "object" &&
	"type" in x &&
	x.type === BridgeRequestType.Request &&
	"channel" in x &&
	x.channel === channel;

export const isBridgeSubRequest = <TCh extends string = typeof DEFAULT_CHANNEL>(
	x: unknown,
	channel: TCh = DEFAULT_CHANNEL as TCh,
): x is BridgeSubRequest<TCh> =>
	!!x &&
	typeof x === "object" &&
	"type" in x &&
	x.type === "sub-request" &&
	"channel" in x &&
	x.channel === channel;

export const isBridgeResponse = <
	TBridge,
	TCh extends string = typeof DEFAULT_CHANNEL,
>(
	x: unknown,
	channel: TCh = DEFAULT_CHANNEL as TCh,
): x is BridgeResponse<BridgeReturnType<TBridge>, TCh> =>
	!!x &&
	typeof x === "object" &&
	"type" in x &&
	typeof x.type === "string" &&
	Object.values(BridgeResponseType).includes(x.type as any) && // as any is ok, because it is the point of the method call
	"channel" in x &&
	x.channel === channel;
