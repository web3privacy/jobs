import { emptyDir } from "https://deno.land/std@0.196.0/fs/empty_dir.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parse } from "npm:yaml";

async function readYamlFile(fn) {
  return parse(await Deno.readTextFile(fn));
}

async function writeJSONFile(fn, data) {
  console.log(`File written: ${fn}`);
  return Deno.writeTextFile(fn, JSON.stringify(data, null, 2));
}

const OUTPUT_DIR = "./dist";
await emptyDir(OUTPUT_DIR);

const items = await readYamlFile("./data/jobs.yaml");
const index = {
  items,
  time: new Date(),
};
await writeJSONFile(join(OUTPUT_DIR, "index.json"), index);
