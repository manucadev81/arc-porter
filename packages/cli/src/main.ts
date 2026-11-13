import { VERSION } from "@arc-porter/core";
import { Command, CommanderError } from "commander";
import { check, explainRule, FORMATS, type Format, listRules, UsageError } from "./run.js";

export function buildProgram(io: { stdout: (s: string) => void; stderr: (s: string) => void }): Command {
  const program = new Command();
  program
    .name("arc-porter")
    .description("Flags Solidity code that breaks or behaves differently on Arc")
    .version(VERSION, "-v, --version")
    .exitOverride()
    .configureOutput({ writeOut: io.stdout, writeErr: io.stderr });

  program
    .command("check")
    .description("Analyze Solidity files or directories")
    .argument("[paths...]", "files, directories or globs", [])
    .option("-f, --format <format>", `output format: ${FORMATS.join(", ")}`, "text")
    .option("--fail-on <severity>", "lowest severity that makes the command fail: low, medium, high")
    .option("-c, --config <file>", "path to arc-porter.json")
    .option("-o, --output <file>", "write the report to a file instead of stdout")
    .option("--no-color", "disable ANSI colors")
    .action(
      (
        paths: string[],
        opts: { format: string; failOn?: string; config?: string; output?: string; color: boolean },
      ) => {
        const outcome = check({
          paths,
          format: opts.format as Format,
          ...(opts.failOn === undefined ? {} : { failOn: opts.failOn as "low" | "medium" | "high" }),
          ...(opts.config === undefined ? {} : { config: opts.config }),
          ...(opts.output === undefined ? {} : { output: opts.output }),
          color: opts.color && process.stdout.isTTY === true,
          cwd: process.cwd(),
        });
        if (outcome.stdout) io.stdout(outcome.stdout);
        if (outcome.stderr) io.stderr(outcome.stderr);
        process.exitCode = outcome.exitCode;
      },
    );

  program
    .command("rules")
    .description("List every rule")
    .option("-f, --format <format>", "text or json", "text")
    .action((opts: { format: string }) => {
      if (opts.format !== "text" && opts.format !== "json")
        throw new UsageError('rules --format must be "text" or "json"');
      io.stdout(listRules(opts.format));
      process.exitCode = 0;
    });

  program
    .command("explain")
    .description("Show a rule with its bad and good example and its source")
    .argument("<rule-id>")
    .action((id: string) => {
      io.stdout(explainRule(id));
      process.exitCode = 0;
    });

  return program;
}

export async function main(argv: string[]): Promise<number> {
  const program = buildProgram({
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
  });
  try {
    await program.parseAsync(argv, { from: "user" });
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === "commander.helpDisplayed" || error.code === "commander.version") return 0;
      return 2;
    }
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n`);
      return 2;
    }
    process.stderr.write(`arc-porter failed: ${(error as Error).message}\n`);
    return 2;
  }
}

const invokedDirectly =
  typeof process.argv[1] === "string" && /(^|[\\/])(main|arc-porter)(\.[cm]?js)?$/.test(process.argv[1]);
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
