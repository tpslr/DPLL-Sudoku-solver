import test from "node:test";
import assert from "node:assert";
import { solveSudoku, Sudoku } from "../sudoku.js";
import { parseSudoku } from "../sudokuParser.js";


function checkSudoku(sudoku: Sudoku, solution: string) {
    const solutionRows = solution.split("\n");
    for (let row = 0; row < 9; row++) {
        const solutionRow = solutionRows[row].split("");
        for (let col = 0; col < 9; col++) {
            const solutionValue = parseInt(solutionRow[col]);
            assert.strictEqual(sudoku[row][col].value, solutionValue, `Value at row ${row + 1} col ${col + 1} Should be ${solutionValue}`);
        }
    }
}


test("sudoku/solveSudoku", () => {
    const sudoku1 = parseSudoku("..3..7..2\n..15..79.\n.9......4\n........9\n.1...436.\n..5.8....\n3..4.....\n......2..\n.6...317.").sudoku;
    const solution1 = "583947612\n641532798\n297168534\n426371859\n819254367\n735689421\n372415986\n158796243\n964823175";
    solveSudoku(sudoku1);
    checkSudoku(sudoku1, solution1);

    const sudoku2 = parseSudoku(".......1.\n4........\n.2.......\n....5.4.7\n..8...3..\n..1.9....\n3..4..2..\n.5.1.....\n...8.6...").sudoku;
    const solution2 = "693784512\n487512936\n125963874\n932651487\n568247391\n741398625\n319475268\n856129743\n274836159";
    solveSudoku(sudoku2);
    checkSudoku(sudoku2, solution2);
});
