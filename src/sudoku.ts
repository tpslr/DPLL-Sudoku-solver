import DPLL from "DPLL";
import { parseCNF, parseSolution } from "./cnf.js";
import { SudokuCNFConverter } from "./sudokuCnfConverter.js";

interface SudokuCell {
    value: number | null,
    possible: number[]
}

type Sudoku = SudokuCell[][];


/**
 * Prints a sudoku to console
 * @returns 
 */
function printSudoku(sudoku: Sudoku) {
    let out = "";
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            out += sudoku[row][col].value ?? ".";
        }
        out += "\n";
    }
    console.log(out);
    return out;
}

/**
 * Solves a sudoku
 * @param sudoku Sudoku to solve
 * @returns The same `sudoku` object or "UNSATISFIABLE""
 */
function solveSudoku(sudoku: Sudoku) {
    const sudokuConverter = new SudokuCNFConverter(sudoku);

    const cnfString = sudokuConverter.convert();

    const cnf = parseCNF(cnfString);

    const solution = DPLL.solve(cnf.variableCount, cnf.clauses);

    if (solution === "UNSATISFIABLE") {
        return solution;
    }

    return sudokuConverter.parseResult(parseSolution(solution, cnf.variableCount));
}


export { printSudoku, solveSudoku };
export type { Sudoku, SudokuCell };
