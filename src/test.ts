import { readdir } from "fs/promises";
import { dirname, join as joinPath } from "path";


const tests = await readdir("./dist/tests");

const only = process.argv[2];

for (const test of tests) {
    if (!test.endsWith(".js")) continue;

    if (only && test.replace(".js", "") !== only) continue; 

    console.info(`Running tests ${test}...`);
    console.info(joinPath(dirname(import.meta.url), "tests", test));
    import(joinPath(dirname(import.meta.url), "tests", test));
}

