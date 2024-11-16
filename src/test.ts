import test from "node:test";
import { readdir, readFile } from "fs/promises";
import { join as joinPath } from "path";
import assert from "node:assert";
import { solveCNF } from "./index.js";

/**
 * Run tests on .cnf files
 * @param dir folder containing *.cnf files and their respective solutions in *.solution files
 */
async function cnfTests(dir: string) {
    const files = await readdir(dir);
    
    for (const file of files) {
        const name = file.replace(/\.cnf$/, "");
        const filePath = joinPath(dir, file);
        const solutionName = name + ".solution";
        const solutionPath = joinPath(dir, solutionName);
        if (!file.endsWith(".cnf")) continue;
        if (!files.includes(solutionName)) {
            test(name, (t) => {
                t.skip(`Found test cnf "${joinPath(dir, file)}" but missing respective ${name}.solution file, skipping.`);
            });
            continue;
        }
        
        // Run test
        test(name, async () => {
            const solution = await solveCNF(filePath);
            assert.strictEqual(solution, await readFile(solutionPath, "utf-8"));
        });
    }
}

cnfTests("./tests/cnf");
