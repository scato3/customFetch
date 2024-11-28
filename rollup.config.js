import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/cjs/index.cjs.js",
      format: "cjs",
      plugins: [terser()],
    },
    {
      file: "dist/esm/index.esm.js",
      format: "esm",
      plugins: [terser()],
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
    }),
  ],
};
