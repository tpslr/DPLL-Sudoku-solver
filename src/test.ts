import test from "node:test";
import { readdir, readFile } from "fs/promises";
import { join as joinPath } from "path";
import assert from "node:assert";
import { solveCNF } from "./index.js";
import { parseCNF } from "./cnf.js";

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

        if (files.includes(name + "_converted")) {
            test(name + "_parsing", async () => {
                // converted form
                const cnf = parseCNF(await readFile(filePath, "utf-8"));

                const expectedNums = await readFile(joinPath(dir, name + "_converted"), "utf-8");

                // split the expected file on newlines
                const expectedClauses = expectedNums.split(/(?:\n|\r|\r\n)/g);

                assert.strictEqual(cnf.clauseCount, expectedClauses.length, "Number of clauses should match!");

                for (let clauseIndex = 0; clauseIndex < cnf.clauseCount; clauseIndex++) {
                    const clause = cnf.clauses[clauseIndex];
                    // split the expected clause on spaces
                    const expectedClause = expectedClauses[clauseIndex].split(" ");

                    for (let i = 0; i < Math.ceil(cnf.variableCount / 64) * 2; i++) {
                        // read 64-bit number from the Buffer
                        const number = clause.readBigUint64LE(i * 8);
                        // read same 64-bit number from the expected clause
                        const expectedNumber = BigInt(parseInt(expectedClause[i], 2));
                        assert.strictEqual(number, expectedNumber);
                    }
                }
            });
        }
    }
}

cnfTests("./tests/cnf");
