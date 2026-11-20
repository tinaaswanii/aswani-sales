import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageDir = path.join(root, "aswani_sales", "img");
const entries = await fs.readdir(imageDir, { withFileTypes: true });
const replacements = [];

for (const entry of entries) {
  if (!entry.isFile() || !/\.(png|jpe?g|jfif)$/i.test(entry.name)) continue;
  const source = path.join(imageDir, entry.name);
  const outputName = entry.name.replace(/\.(png|jpe?g|jfif)$/i, ".webp");
  const output = path.join(imageDir, outputName);

  await sharp(source)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(output);

  replacements.push({
    from: `/img/${entry.name}`,
    to: `/img/${outputName}`
  });
  replacements.push({
    from: `img/${entry.name}`,
    to: `img/${outputName}`
  });

  const before = (await fs.stat(source)).size;
  const after = (await fs.stat(output)).size;
  console.log(`${entry.name}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}

async function walk(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full);
    else if (/\.(html|css|js)$/i.test(item.name)) {
      let content = await fs.readFile(full, "utf8");
      const original = content;
      for (const { from, to } of replacements) content = content.split(from).join(to);
      if (content !== original) await fs.writeFile(full, content);
    }
  }
}

await walk(path.join(root, "aswani_sales"));
console.log(`Created ${replacements.length / 2} WebP images and updated matching site references.`);
