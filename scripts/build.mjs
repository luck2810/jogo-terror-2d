import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const out = new URL("../dist/", import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ["index.html", "css", "js", "docs", "assets", "README.md", "LICENSE", "manus-routes.json", "public", ".nojekyll"]) {
  try { await cp(new URL(`../${entry}`, import.meta.url), new URL(`../dist/${entry}`, import.meta.url), { recursive: true }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
console.log(`Saída estática pronta em ${new URL("../dist/", import.meta.url).pathname}`);
