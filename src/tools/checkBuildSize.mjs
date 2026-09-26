import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const limit = 180_000_000;
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(async entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [{ file, bytes: (await stat(file)).size }];
  }));
  return groups.flat();
}
const entries = await files(fileURLToPath(new URL("../../dist/", import.meta.url)));
const total = entries.reduce((sum, entry) => sum + entry.bytes, 0);
console.log(`Distribution: ${(total / 1e6).toFixed(2)} MB / 180 MB (${entries.length} files)`);
console.log(`Remaining: ${((limit - total) / 1e6).toFixed(2)} MB`);
if (total > limit) process.exitCode = 1;
