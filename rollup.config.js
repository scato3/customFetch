import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";

export default {
  input: "src/index.ts", // 진입점 파일
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs", // CommonJS 포맷
      sourcemap: true,
    },
    {
      file: "dist/index.esm.js",
      format: "esm", // ES Module 포맷
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(), // node_modules 패키지들을 가져옴
    commonjs(), // CommonJS 모듈들을 변환
    typescript({ tsconfig: "./tsconfig.json" }), // TypeScript 지원
    babel({
      babelHelpers: "bundled",
      presets: [
        ["@babel/preset-env", { targets: "> 0.25%, not dead", modules: false }],
      ],
      extensions: [".js", ".ts"], // Babel이 처리할 파일 확장자
      exclude: "node_modules/**", // node_modules 제외
    }),
  ],
};
