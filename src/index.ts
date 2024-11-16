import { readFile } from "fs/promises";
import DPLL from "DPLL";
import { parseCNF, parseSolution } from "./cnf.js";

// import "./sudoku.js";

/**
 * Solves a conjuctive normal form SAT problem in a file
 * @param path File path to CNF SAT problem
 * @returns Solution to CNF SAT problem or "UNSATISFIABLE"
 */
async function solveCNF(path: string) {
    const data = await readFile(path, "utf-8");

    const cnf = parseCNF(data);

    const solution = DPLL.solve(cnf.variableCount, cnf.clauses);

    if (solution === "UNSATISFIABLE") {
        return solution;
    }

    return parseSolution(solution, cnf.variableCount);
}

export { solveCNF };
