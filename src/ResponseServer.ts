import { nanoid } from "nanoid";
import { SerializedError } from "./SerializedError";
import {
	BridgeRequest,
	BridgeResponse,
	BridgeResponseType,
	BridgeSubRequest,
} from "./bridgeTypes";
import { Unreachable } from "./utils/errors";
import { isBridgeSubRequest } from "./validations";

export class ResponseServer<TBridge extends object> {
	public readonly ctx = new Map<string, RequestContext>();

	constructor(
		private requestHandler: TBridge,
		private defaultOptions: CreateResponseOptions = {},
	) {}

	/**
	 * Creates response from a request with a provided bridge
	 * @param requestHandler handler with the same interface as the bridge
	 * @param request request from the other side of the bridge
	 * @returns bridge response
	 */
	async createResponse<TCh extends string>(
		request: BridgeRequest<unknown[], TCh> | BridgeSubRequest<TCh>,
		{
			onReject = this.defaultOptions.onReject,
			sesh,
		}: CreateResponseOptions = {},
	): Promise<BridgeResponse<unknown, TCh>> {
		if (isBridgeSubRequest(request, request.channel)) {
			return this.createSubResponse(request, { onReject });
		}

		try {
			const handler = resolvePath(this.requestHandler, request.path);
			const result: any = await handler(...request.args);

			if (isAsyncIterator(result)) {
				this.ctx.set(request.id, {
					type: "async-iterator",
					iterator: result,
					sesh,
				});

				return {
					type: BridgeResponseType.ResponseIterator,
					channel: request.channel,
					id: request.id,
				};
			}

			if (typeof result === "function") {
				this.ctx.set(request.id, {
					type: "function",
					function: result,
					sesh,
				});

				return {
					type: BridgeResponseType.ResponseFunction,
					channel: request.channel,
					id: request.id,
				};
			}

			return {
				type: BridgeResponseType.Response,
				channel: request.channel,
				id: request.id,
				result,
			};
		} catch (error) {
			onReject?.(error);
			return {
				type: BridgeResponseType.Error,
				channel: request.channel,
				id: request.id,
				error: SerializedError.toJSON(error),
			};
		}
	}

	public getSeshToken(): SeshToken {
		return {
			seshTokenSymbol,
			id: nanoid(),
			createdAt: Date.now(),
		};
	}

	private async createSubResponse<TCh extends string>(
		subRequest: BridgeSubRequest<TCh>,
		options?: CreateResponseOptions,
	): Promise<BridgeResponse<unknown, TCh>> {
		const item = this.ctx.get(subRequest.id);

		if (!item) Unreachable.throw();

		if (
			subRequest.subRequest === "async-iterator-next" &&
			item.type === "async-iterator"
		) {
			try {
				const result = await item.iterator.next();

				if (result.done) {
					this.ctx.delete(subRequest.id);
				}

				return {
					type: BridgeResponseType.ResponseFunctionReturn,
					channel: subRequest.channel,
					id: subRequest.id,
					result,
				};
			} catch (e) {
				options?.onReject?.(e);
				return {
					type: BridgeResponseType.Error,
					channel: subRequest.channel,
					id: subRequest.id,
					error: e,
				};
			}
		}

		if (subRequest.subRequest === "function-call" && item.type === "function") {
			const result = await item.function(...(subRequest.args as never[]));
			this.ctx.delete(subRequest.id);

			return {
				type: BridgeResponseType.ResponseIteratorNext,
				channel: subRequest.channel,
				id: subRequest.id,
				result,
			};
		}

		Unreachable.throw(
			`Invalid subRequest: ${subRequest.subRequest} and item type ${item.type}`,
		);
	}
}

const seshTokenSymbol = Symbol("seshToken");

interface CreateResponseOptions {
	onReject?: (e: unknown) => unknown;
	sesh?: SeshToken;
}

interface SeshToken {
	seshTokenSymbol: typeof seshTokenSymbol;
	id: string;
	createdAt: number;
}

type RequestContext = {
	sesh?: SeshToken;
} & (
	| {
			type: "async-iterator";
			iterator: AsyncIterator<unknown>;
	  }
	| {
			type: "function";
			function: (...args: never[]) => unknown;
	  }
);

const resolvePath = (requestHandler: object, path: string[]) => {
	if (path.length === 0) Unreachable.throw();

	let result: any = requestHandler;

	for (const segment of path.slice(0, -1)) {
		if (result[segment]) {
			result = result[segment];
		} else {
			throw new Error(`Invalid bridge request with path: ${path.join(".")}`);
		}
	}

	const lastSegment: any = path.at(-1);

	if (typeof result[lastSegment] !== "function") {
		Unreachable.throw(`Path ${path.join(".")} is not a function`);
	}

	return (...args: any[]) => result[lastSegment](...args);
};

const isAsyncIterator = (x: unknown): x is AsyncIterator<unknown> =>
	!!x && typeof x === "object" && "next" in x && typeof x.next === "function";
