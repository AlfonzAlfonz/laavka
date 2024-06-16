export class Unreachable extends Error {
	public constructor(msg?: string) {
		super(`This code should not be reached ${msg ? `(${msg})` : ""}`);
	}

	public static throw(msg?: string): never {
		throw new this(msg);
	}
}

export class TodoError extends Error {
	public constructor() {
		super("TODO");
	}

	public static throw(): never {
		throw new this();
	}
}

export type TODO = any;
