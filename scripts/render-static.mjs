import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const version =
  process.argv[2] ||
  execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();

const htmlFiles = ["index.html", "matchmaker.html", "admin.html"];

await mkdir(distDir, { recursive: true });

for (const filename of htmlFiles) {
  const sourcePath = path.join(rootDir, filename);
  const outputPath = path.join(distDir, filename);
  const template = await readFile(sourcePath, "utf8");
  const rendered = template.replaceAll("__ASSET_VERSION__", version);
  await writeFile(outputPath, rendered, "utf8");
}

await writeFile(
  path.join(distDir, "version.json"),
  `${JSON.stringify({ assetVersion: version }, null, 2)}\n`,
  "utf8",
);

process.stdout.write(`Rendered static assets with version ${version}\n`);
