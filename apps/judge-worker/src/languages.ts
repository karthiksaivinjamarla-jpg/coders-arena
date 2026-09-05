export type LanguageConfig = {
  slug: "cpp" | "python" | "java" | "javascript";
  imageEnv: string;
  defaultImage: string;
  sourceFile: string;
  command: string;
};

export const LANGUAGE_CONFIGS: Record<LanguageConfig["slug"], LanguageConfig> = {
  cpp: {
    slug: "cpp",
    imageEnv: "JUDGE_CPP_IMAGE",
    defaultImage: "coders-arena/cpp:1",
    sourceFile: "main.cpp",
    command:
      "g++ -std=c++20 -O2 -pipe /input/main.cpp -o /workspace/main 2>/tmp/compile.err; rc=$?; if [ $rc -ne 0 ]; then printf '__CA_COMPILE_ERROR__\\n'; cat /tmp/compile.err; exit 125; fi; /workspace/main < /input/stdin.txt",
  },
  python: {
    slug: "python",
    imageEnv: "JUDGE_PYTHON_IMAGE",
    defaultImage: "coders-arena/python:1",
    sourceFile: "main.py",
    command: "python3 /input/main.py < /input/stdin.txt",
  },
  java: {
    slug: "java",
    imageEnv: "JUDGE_JAVA_IMAGE",
    defaultImage: "coders-arena/java:1",
    sourceFile: "Main.java",
    command:
      "javac -encoding UTF-8 -J-Xmx256m /input/Main.java -d /workspace 2>/tmp/compile.err; rc=$?; if [ $rc -ne 0 ]; then printf '__CA_COMPILE_ERROR__\\n'; cat /tmp/compile.err; exit 125; fi; java -Xms16m -Xmx256m -Djava.io.tmpdir=/tmp -cp /workspace Main < /input/stdin.txt",
  },
  javascript: {
    slug: "javascript",
    imageEnv: "JUDGE_JAVASCRIPT_IMAGE",
    defaultImage: "coders-arena/javascript:1",
    sourceFile: "main.js",
    command: "node --max-old-space-size=256 /input/main.js < /input/stdin.txt",
  },
};

export function getLanguageConfig(slug: string) {
  return LANGUAGE_CONFIGS[slug as LanguageConfig["slug"]] ?? null;
}
