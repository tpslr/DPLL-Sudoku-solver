import { readFile } from "fs/promises";
import DPLL from "DPLL";
import { parseCNF, parseSolution } from "./cnf.js";
import { solveSudoku } from "./sudoku.js";
import { SudokuCNFConverter } from "./sudokuCnfConverter.js";

import express from "express";
import bodyParser from "body-parser";
const app = express();


app.use(express.static("./static"));

app.get("/index.js", (req, res) => {
    res.sendFile("./frontend/index.js", { root: import.meta.dirname });
});

app.post("/solve", bodyParser.json(), (req, res) => {
    const response = {
        result: solveSudoku(req.body)
    };
    res.send(response);
});


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
const server = app.listen(5001, () => {
    let address = server.address();
    if (typeof address === "object" && address !== null) {
        address = `http://localhost:${address.port}`;
    }
    console.log(`Listening on ${address}`);
});

export { solveCNF };
