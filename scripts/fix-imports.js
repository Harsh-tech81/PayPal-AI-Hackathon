import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts)$/.test(f.name)) {
      const src = fs.readFileSync(full, "utf8");
      const fixed = src.replace(/from\s+(['"])(.*?)\.js(['"])/g, "from $1$2$3");
      if (src !== fixed) {
        fs.writeFileSync(full, fixed, "utf8");
        console.log("Updated:", full);
      }
    }
  }
}

walk(path.resolve("web-app/src"));
