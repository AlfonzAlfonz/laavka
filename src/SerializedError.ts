import { TodoError } from "./utils/errors";

export class SerializedError extends Error {
	public static toJSON(e: unknown): SerializedErrorData {
		if (e instanceof Error) {
			return {
				brand: "SerializedError",
				name: e.name,
				message: e.message,
				stack: e.stack,
			};
		}

		return {
			brand: "SerializedError",
			message: String(e),
		};
	}

	public static fromJSON(json: unknown) {
		if (!isSerializedErrorData(json)) TodoError.throw();

		const e = new SerializedError(json.message);
		if (json.name) e.name = json.name;
		if (json.stack) e.stack = json.stack;

		return e;
	}
}

const isSerializedErrorData = (json: unknown): json is SerializedErrorData =>
	!!json &&
	typeof json === "object" &&
	"brand" in json &&
	json.brand === "SerializedError" &&
	"message" in json &&
	typeof json.message === "string" &&
	"name" in json &&
	(json.name === undefined || typeof json.name === "string") &&
	"stack" in json &&
	(json.name === undefined || typeof json.name === "string");

export type SerializedErrorData = {
	brand: "SerializedError";
	message: string;
	name?: string;
	stack?: string;
};
