import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
    }),
    babel({
      babelHelpers: "bundled",
      presets: [
        ["@babel/preset-env", { targets: "> 0.25%, not dead", modules: false }],
      ],
      extensions: [".js", ".ts"],
      exclude: "node_modules/**",
    }),
    terser(),
  ],
};
