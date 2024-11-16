import { execSync } from "child_process";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

if (process.argv.length < 4) {
    console.log("Usage: node generate_cnf_test_solutions.js <path to tests> <path to kissat>");
    process.exit(1);
}

const testsPath = process.argv[2];
const kissat = process.argv[3];


const files = await readdir(testsPath);

for (const file of files) {
    if (!file.endsWith(".cnf")) {
        console.info(`Skipping file ${file}, not .cnf`);
        continue;
    }
    const filePath = join(testsPath, file);
    const output = execSync(`${kissat} --relaxed --quiet ${filePath} || true`, { encoding: "utf-8" });

    console.log(output);
    
    const satisfiable = output.matchAll(/s (SATISFIABLE|UNSATISFIABLE)$/mg).next()?.value?.[1];
    
    /** @type {string | undefined} */
    const solutionRaw = output.matchAll(/((?:v(?: -?\d+)+(?:(?:\n|\r|\r\n)| 0))+)/g).next()?.value?.[1];

    console.log(solutionRaw);
    
    if (satisfiable == "UNSATISFIABLE") {
        await writeFile(filePath.replace(/\.cnf$/, ".solution"), "UNSATISFIABLE");
        continue;
    }

    const solution = solutionRaw.
        replace(/(?:\n|\r|\r\n)v /g, " ").
        replace(/^v /, "").
        replace(/(?:\n|\r|\r\n)/, "");

    await writeFile(filePath.replace(/\.cnf$/, ".solution"), solution);
}

