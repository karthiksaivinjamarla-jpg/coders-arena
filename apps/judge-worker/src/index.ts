import { createClient } from "@supabase/supabase-js";
import { createQueue, type SubmissionJob } from "./queue";
import { executeInSandbox, type SandboxResult } from "./executor";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
}

function verdictForOutput(actual: string, expected: string): "accepted" | "wrong_answer" {
  return normalizeOutput(actual) === normalizeOutput(expected) ? "accepted" : "wrong_answer";
}

async function markSystemError(submissionId: string, stderr: string) {
  await supabase
    .from("submissions")
    .update({ status: "system_error" })
    .eq("id", submissionId)
    .in("status", ["queued", "compiling", "running"]);
  console.error(`[judge] ${submissionId}: ${stderr}`);
}

async function processJob(job: SubmissionJob) {
  console.log(`[judge] received ${job.submissionId}`);

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id,status,contest_id,problem_id,language_id,source_code")
    .eq("id", job.submissionId)
    .maybeSingle();
  if (submissionError) throw submissionError;
  if (!submission) return;
  if (submission.status !== "queued") return;

  const { data: problem, error: problemError } = await supabase
    .from("problems")
    .select("id,time_limit_ms,memory_limit_mb")
    .eq("id", submission.problem_id)
    .maybeSingle();
  if (problemError) throw problemError;
  if (!problem) return markSystemError(job.submissionId, "Problem not found");

  const { data: language, error: languageError } = await supabase
    .from("languages")
    .select("id,slug,is_active")
    .eq("id", submission.language_id)
    .maybeSingle();
  if (languageError) throw languageError;
  if (!language || !language.is_active) return markSystemError(job.submissionId, "Language is unavailable");
  const supportedLanguages = new Set(["cpp", "python", "java", "javascript"]);
  if (!supportedLanguages.has(language.slug)) {
    return markSystemError(job.submissionId, `Unsupported language: ${language.slug}`);
  }

  const { data: testCases, error: testsError } = await supabase
    .from("test_cases")
    .select("id,input_data,expected_output,points,display_order")
    .eq("problem_id", submission.problem_id)
    .order("display_order", { ascending: true });
  if (testsError) throw testsError;
  if (!testCases?.length) return markSystemError(job.submissionId, "Problem has no test cases");

  const { error: compilingError } = await supabase
    .from("submissions")
    .update({ status: "compiling" })
    .eq("id", job.submissionId)
    .eq("status", "queued");
  if (compilingError) throw compilingError;

  let totalScore = 0;
  let finalStatus: "accepted" | "wrong_answer" | "runtime_error" | "time_limit" | "memory_limit" | "compile_error" | "system_error" = "accepted";
  let totalTime = 0;
  let maxMemory = 0;

  for (const testCase of testCases) {
    const { error: runningError } = await supabase
      .from("submissions")
      .update({ status: "running" })
      .eq("id", job.submissionId)
      .in("status", ["compiling", "running"]);
    if (runningError) throw runningError;

    const result: SandboxResult = await executeInSandbox({
      language: language.slug as "cpp" | "python" | "java" | "javascript",
      sourceCode: submission.source_code,
      stdin: testCase.input_data,
      limits: {
        timeoutMs: problem.time_limit_ms,
        memoryMb: problem.memory_limit_mb,
        maxOutputBytes: 1_000_000,
      },
    });

    totalTime += result.timeMs;
    maxMemory = Math.max(maxMemory, result.memoryKb);

    let caseVerdict = result.verdict;
    let caseScore = 0;
    if (result.verdict === "accepted") {
      caseVerdict = verdictForOutput(result.stdout, testCase.expected_output);
      if (caseVerdict === "accepted") caseScore = testCase.points;
    }

    const { error: resultError } = await supabase.from("submission_results").upsert({
      submission_id: job.submissionId,
      test_case_id: testCase.id,
      verdict: caseVerdict,
      execution_time_ms: result.timeMs,
      memory_kb: result.memoryKb,
      stdout: result.stdout,
      stderr: result.stderr,
    }, { onConflict: "submission_id,test_case_id" });
    if (resultError) throw resultError;

    totalScore += caseScore;
    if (caseVerdict !== "accepted") {
      finalStatus = caseVerdict;
      break;
    }
  }

  const { error: finalError } = await supabase
    .from("submissions")
    .update({
      status: finalStatus,
      score: totalScore,
      execution_time_ms: totalTime,
      memory_kb: maxMemory,
    })
    .eq("id", job.submissionId)
    .eq("status", "running");
  if (finalError) throw finalError;

  console.log(`[judge] ${job.submissionId}: ${finalStatus}, score=${totalScore}`);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }
  if (!process.env.JUDGE_CPP_IMAGE) {
    console.warn("[judge] JUDGE_CPP_IMAGE not set; using coders-arena/cpp:1");
  }

  console.log("[judge] Coders Arena Stage 8 multi-language worker online");
  const queue = createQueue();
  await queue.consume(async (job) => {
    try {
      await processJob(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markSystemError(job.submissionId, message);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
