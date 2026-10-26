import { realpathSync } from "node:fs";
import path from "node:path";

// Resolve existing symlinks even when the final output directory is new.
function canonicalPath(directory) {
  try {
    return realpathSync(directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const parent = path.dirname(directory);
    if (parent === directory) throw error;
    return path.join(canonicalPath(parent), path.basename(directory));
  }
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith(`..${path.sep}`)
    && relative !== ".." && !path.isAbsolute(relative));
}

export function privateSourceMapDirectory(directory, repositoryRoot) {
  if (!directory || !path.isAbsolute(directory)) {
    throw new Error("Private source maps require an explicit absolute output directory outside the repository.");
  }
  const output = canonicalPath(path.resolve(directory));
  const repository = canonicalPath(path.resolve(repositoryRoot));
  if (contains(repository, output) || contains(output, repository)) {
    throw new Error("Private source maps cannot use the repository, a descendant, or an ancestor as their output directory.");
  }
  return output;
}
