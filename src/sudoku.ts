import DPLL from "DPLL";
import { parseCNF, parseSolution } from "./cnf.js";
import { SudokuCNFConverter } from "./sudokuCnfConverter.js";
import { performance } from "perf_hooks";

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

type SudokuSolveResult = ({
    satisfiable: true
    result: Sudoku
} | {
    satisfiable: false
    result: "UNSATISFIABLE"
}) & {
    conversionTime: number
    parsingTime: number
    solvingTime: number
}

/**
 * Solves a sudoku
 * @param sudoku Sudoku to solve
 * @returns The same `sudoku` object or "UNSATISFIABLE""
 */
function solveSudoku(sudoku: Sudoku): SudokuSolveResult {    
    performance.mark("start");
    const sudokuConverter = new SudokuCNFConverter(sudoku);
    
    const cnfString = sudokuConverter.convert();

    performance.mark("sudoku converted");

    const cnf = parseCNF(cnfString);

    performance.mark("cnf parsed");

    const solution = DPLL.solve(cnf.variableCount, cnf.clauses);

    performance.mark("solved");


    const conversionTime = performance.measure("Sudoku conversion", "start", "sudoku converted").duration;
    const parsingTime = performance.measure("CNF parsing", "sudoku converted", "cnf parsed").duration;
    const solvingTime = performance.measure("solving", "cnf parsed", "solved").duration;


    if (solution === "UNSATISFIABLE") {
        return {
            satisfiable: false,
            result: solution,
            conversionTime,
            parsingTime,
            solvingTime,
        };
    }

    return {
        satisfiable: true,
        result: sudokuConverter.parseResult(parseSolution(solution, cnf.variableCount)),
        conversionTime,
        parsingTime,
        solvingTime,
    }; 
}


export { printSudoku, solveSudoku };
export type { Sudoku, SudokuCell, SudokuSolveResult };
