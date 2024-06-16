export const DEFAULT_CHANNEL = "default";

export enum BridgeRequestType {
	Request = "request",
	SubRequest = "sub-request",
}

export enum BridgeResponseType {
	Response = "response",
	ResponseFunction = "response-function",
	ResponseFunctionReturn = "response-function-return",
	ResponseIterator = "response-iterator",
	ResponseIteratorNext = "response-iterator-next",
	Error = "error",
}

export enum BridgeSubRequestType {
	AsyncIteratorNext = "async-iterator-next",
	FunctionCall = "function-call",
}

export type BridgeRequest<T extends any[], TCh extends string> =
	| BridgeInitRequest<T, TCh>
	| BridgeSubRequest<TCh>;

export type BridgeInitRequest<T extends any[], TCh extends string> = {
	type: BridgeRequestType.Request;
	channel: TCh;
	id: string;
	path: string[];
	args: T;
};

export type BridgeSubRequest<TCh extends string> =
	| (BaseSubRequest<TCh> & {
			subRequest: BridgeSubRequestType.AsyncIteratorNext;
			value?: unknown;
	  })
	| (BaseSubRequest<TCh> & {
			subRequest: BridgeSubRequestType.FunctionCall;
			args: unknown[];
	  });

type BaseSubRequest<TCh extends string> = {
	type: BridgeRequestType.SubRequest;
	channel: TCh;
	id: string;
};

export type BridgeResponse<T, TCh extends string> =
	| {
			type: BridgeResponseType.Response;
			channel: TCh;
			id: string;
			result: IteratorResult<T>;
	  }
	| { type: BridgeResponseType.ResponseFunction; channel: TCh; id: string }
	| {
			type: BridgeResponseType.ResponseFunctionReturn;
			channel: TCh;
			id: string;
			result: T;
	  }
	| { type: BridgeResponseType.ResponseIterator; channel: TCh; id: string }
	| {
			type: BridgeResponseType.ResponseIteratorNext;
			channel: TCh;
			id: string;
			result: T;
	  }
	| {
			type: BridgeResponseType.Error;
			channel: TCh;
			id: string;
			error: unknown;
	  };

export type BridgeParameters<
	TBridge,
	TKey extends keyof TBridge = keyof TBridge,
> = TBridge[TKey] extends (...args: unknown[]) => unknown
	? Parameters<TBridge[TKey]>
	: never;

export type BridgeReturnType<
	TBridge,
	TKey extends keyof TBridge = keyof TBridge,
> = TBridge[TKey] extends (...args: unknown[]) => unknown
	? Awaited<ReturnType<TBridge[TKey]>>
	: never;
