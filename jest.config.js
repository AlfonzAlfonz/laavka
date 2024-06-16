/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest/presets/default-esm", // or other ESM presets
	testPathIgnorePatterns: ["/node_modules/", "_utils.test.ts"],
	collectCoverage: true,
	collectCoverageFrom: ["./src/**"],
	coveragePathIgnorePatterns: [
		"/node_modules/",
		"/src/runtime/store/vscode.git",
	],
};
