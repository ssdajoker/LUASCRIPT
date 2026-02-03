/**
 * Phase F - Lua-side Optimization (Peephole Optimizer)
 *
 * Initial conservative optimizer focused on formatting-safe improvements:
 * - Trim trailing whitespace (outside long strings/comments)
 * - Collapse excessive blank lines (outside long strings/comments)
 *
 * This is intentionally conservative to avoid semantic changes.
 */

class LuaPeepholeOptimizer {
  constructor(options = {}) {
    this.options = {
      trimTrailingWhitespace: options.trimTrailingWhitespace !== false,
      compactBlankLines: options.compactBlankLines !== false,
      maxConsecutiveBlankLines: Number.isInteger(options.maxConsecutiveBlankLines)
        ? options.maxConsecutiveBlankLines
        : 1,
    };

    this.stats = this.resetStats();
  }

  resetStats() {
    return {
      linesProcessed: 0,
      trailingWhitespaceTrimmed: 0,
      blankLinesCollapsed: 0,
      optimizationsApplied: 0,
    };
  }

  getStats() {
    return { ...this.stats };
  }

  optimize(code, context = {}) {
    if (typeof code !== "string") {
      return { code, stats: this.getStats(), applied: false, context };
    }

    const lines = code.split(/\r?\n/);
    const output = [];

    let blankRun = 0;
    let inLongString = false;
    let longLevels = 0;
    let inBlockComment = false;
    let blockLevels = 0;

    this.stats = this.resetStats();

    for (const line of lines) {
      this.stats.linesProcessed += 1;

      const containsLongDelimiter = /\[=\*\[|\]=\*\]/.test(line);
      const safeToModify = !inLongString && !inBlockComment && !containsLongDelimiter;

      let nextLine = line;

      if (safeToModify && this.options.trimTrailingWhitespace) {
        const trimmed = nextLine.replace(/[ \t]+$/g, "");
        if (trimmed !== nextLine) {
          nextLine = trimmed;
          this.stats.trailingWhitespaceTrimmed += 1;
        }
      }

      if (safeToModify && this.options.compactBlankLines) {
        if (nextLine.trim() === "") {
          blankRun += 1;
          if (blankRun > this.options.maxConsecutiveBlankLines) {
            this.stats.blankLinesCollapsed += 1;
            this.updateLongState(line, { inLongString, longLevels, inBlockComment, blockLevels }, (state) => {
              inLongString = state.inLongString;
              longLevels = state.longLevels;
              inBlockComment = state.inBlockComment;
              blockLevels = state.blockLevels;
            });
            continue;
          }
        } else {
          blankRun = 0;
        }
      } else if (!safeToModify) {
        blankRun = 0;
      }

      output.push(nextLine);

      this.updateLongState(line, { inLongString, longLevels, inBlockComment, blockLevels }, (state) => {
        inLongString = state.inLongString;
        longLevels = state.longLevels;
        inBlockComment = state.inBlockComment;
        blockLevels = state.blockLevels;
      });
    }

    const optimized = output.join("\n");
    const applied = this.stats.trailingWhitespaceTrimmed > 0 || this.stats.blankLinesCollapsed > 0;

    if (applied) {
      this.stats.optimizationsApplied = this.stats.trailingWhitespaceTrimmed + this.stats.blankLinesCollapsed;
    }

    return {
      code: optimized,
      stats: this.getStats(),
      applied,
      context,
    };
  }

  updateLongState(line, state, update) {
    let { inLongString, longLevels, inBlockComment, blockLevels } = state;
    let index = 0;

    const matchLongOpen = (pos) => {
      if (line[pos] !== "[") return 0;
      let j = pos + 1;
      let eqs = 0;
      while (j < line.length && line[j] === "=") {
        eqs += 1;
        j += 1;
      }
      return line[j] === "[" ? eqs + 1 : 0;
    };

    const matchLongClose = (pos, levels) => {
      if (line[pos] !== "]") return false;
      let j = pos + 1;
      let eqs = 0;
      while (j < line.length && line[j] === "=") {
        eqs += 1;
        j += 1;
      }
      return eqs === levels - 1 && line[j] === "]";
    };

    while (index < line.length) {
      if (inBlockComment) {
        if (matchLongClose(index, blockLevels)) {
          inBlockComment = false;
          index += 1 + blockLevels;
          continue;
        }
        index += 1;
        continue;
      }

      if (inLongString) {
        if (matchLongClose(index, longLevels)) {
          inLongString = false;
          index += 1 + longLevels;
          continue;
        }
        index += 1;
        continue;
      }

      if (line[index] === "-" && line[index + 1] === "-") {
        const levels = matchLongOpen(index + 2);
        if (levels) {
          inBlockComment = true;
          blockLevels = levels;
          index += 2 + levels;
          continue;
        }
        break;
      }

      if (line[index] === "[") {
        const levels = matchLongOpen(index);
        if (levels) {
          inLongString = true;
          longLevels = levels;
          index += 1 + levels;
          continue;
        }
      }

      index += 1;
    }

    update({ inLongString, longLevels, inBlockComment, blockLevels });
  }
}

module.exports = {
  LuaPeepholeOptimizer,
};
