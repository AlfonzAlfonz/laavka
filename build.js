import * as esbuild from "esbuild";
import ts from "typescript";
import pkg from "./package.json" with { type: "json" };
import tsconfig from "./tsconfig.json" with { type: "json" };
import { fs } from "zx";

const commonOptions = {
	target: "es6",
	bundle: true,
	external: [...Object.keys(pkg.dependencies)],
	outdir: "./dist",
};

await fs.rm("./dist", { recursive: true, force: true });

await Promise.all([
	(async () => {
		esbuild.build({
			...commonOptions,
			entryPoints: { cjs: "./src/index.ts" },
			format: "cjs",
			outExtension: { ".js": ".cjs" },
		});
	})(),
	(async () => {
		esbuild.build({
			...commonOptions,
			entryPoints: { esm: "./src/index.ts" },
			format: "esm",
			outExtension: { ".js": ".mjs" },
		});
	})(),
	(async () => {
		const p = ts.createProgram(["./src/index.ts"], {
			...tsconfig.compilerOptions,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			target: ts.ScriptTarget.ESNext,
		});

		p.emit();
	})(),
]);
