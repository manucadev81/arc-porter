export function globToRegExp(pattern: string): RegExp {
  let out = "^";
  const normalized = pattern.replace(/\\/g, "/").replace(/^\.\//, "");
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === "*") {
      if (normalized[i + 1] === "*") {
        const slash = normalized[i + 2] === "/";
        out += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else out += "[^/]*";
    } else if (ch === "?") out += "[^/]";
    else if (ch !== undefined && /[.+^${}()|[\]\\]/.test(ch)) out += `\\${ch}`;
    else out += ch;
  }
  return new RegExp(`${out}$`);
}

export function matchesGlob(file: string, pattern: string): boolean {
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normalized === pattern.replace(/^\.\//, "")) return true;
  return globToRegExp(pattern).test(normalized);
}

export function matchesAny(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesGlob(file, pattern));
}
