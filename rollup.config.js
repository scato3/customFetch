import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";
import { terser } from "@rollup-plugin-terser";

const es5Config = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/es5/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/es5/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.es5.json",
      declaration: true,
    }),
    babel({
      babelHelpers: "bundled",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: "> 0.25%, not dead, ie 11",
            modules: false,
          },
        ],
      ],
      extensions: [".js", ".ts"],
      exclude: "node_modules/**",
    }),
    terser(),
  ],
};

const es6Config = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/es6/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/es6/index.esm.js",
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
    terser(),
  ],
};

export default [es5Config, es6Config];
