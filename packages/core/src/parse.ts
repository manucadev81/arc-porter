import { ParserError, parse as parseSolidity } from "@solidity-parser/parser";
import type { AstNode } from "./finding.js";

export interface ParsedFile {
  file: string;
  source: string;
  ast: AstNode;
}

export interface ParseFailure {
  file: string;
  message: string;
}

export type ParseResult = { ok: true; parsed: ParsedFile } | { ok: false; failure: ParseFailure };

export function parseSource(file: string, source: string): ParseResult {
  try {
    const ast = parseSolidity(source, { loc: true, range: true, tolerant: false }) as unknown as AstNode;
    return { ok: true, parsed: { file, source, ast } };
  } catch (error) {
    return { ok: false, failure: { file, message: describe(error) } };
  }
}

function describe(error: unknown): string {
  if (error instanceof ParserError) {
    const first = error.errors[0];
    if (first) return `line ${first.line}, column ${first.column + 1}: ${first.message}`;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
