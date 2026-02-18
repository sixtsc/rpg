import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENTRY_ORDER = ["data", "engine", "state", "storage", "ui", "main"];
const args = new Set(process.argv.slice(2));
const watchMode = args.has("--watch");
const sourcemap = args.has("--sourcemap");

const inputFiles = ENTRY_ORDER.map((name) => path.join(ROOT, "js", `${name}.js`));
const outFile = path.join(ROOT, "js", "bundle.js");

function transformModuleSource(source) {
  return source
    .replace(/^\s*import\s+[^;]+;\s*$/gm, "")
    .replace(/^\s*export\s+(const|function|class)\s+/gm, "$1 ")
    .replace(/^\s*export\s+default\s+/gm, "");
}

function buildBundle() {
  const sections = ENTRY_ORDER.map((name, idx) => {
    const source = fs.readFileSync(inputFiles[idx], "utf8");
    const transformed = transformModuleSource(source).trimEnd();
    return `/* ===== ${name}.js ===== */\n${transformed}`;
  });

  const banner = [
    "(function(){",
    "'use strict';",
    "window.__BUNDLE_LOADED__=true;",
    "try{var _el=document.getElementById('menuSub'); if(_el && _el.textContent && _el.textContent.indexOf('JS')===0){ _el.textContent='Pilih opsi:'; }}catch(e){}",
    ""
  ].join("\n");

  const body = `${banner}${sections.join("\n\n")}\n\n})();\n`;
  fs.writeFileSync(outFile, body, "utf8");

  const relOut = path.relative(ROOT, outFile);
  console.log(`[build] wrote ${relOut} (${Buffer.byteLength(body)} bytes)`);

  if (sourcemap) {
    console.warn("[warn] --sourcemap belum didukung pada bundler internal ini.");
  }
}

buildBundle();

if (watchMode) {
  console.log("[watch] listening for changes in js/*.js...");
  const debounce = new Map();
  for (const file of inputFiles) {
    fs.watch(file, () => {
      if (debounce.get(file)) clearTimeout(debounce.get(file));
      debounce.set(
        file,
        setTimeout(() => {
          try {
            buildBundle();
          } catch (error) {
            console.error("[build] failed:", error.message);
          }
        }, 80)
      );
    });
  }
}
