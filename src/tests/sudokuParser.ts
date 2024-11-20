import test from "node:test";
import assert from "node:assert";
import { parseSudoku } from "../sudokuParser.js";


test("sudokuParser/parseSudoku", () => {
    const testSudoku1 = "12.......\n.........\n.........\n.........\n.........\n.........\n.........\n.........\n.........\n";
    const testSudoku2 = ".........\n.........\n14.......\n.........\n.........\n.........\n.........\n.........\n.........\n";

    const sudoku1 = parseSudoku(testSudoku1);

    // value at 0, 0 is 1
    assert.strictEqual(sudoku1[0][0].value, 1);
    // no possibilities since value is set already
    assert.deepStrictEqual(sudoku1[0][0].possible, []);

    // value at 0, 1 is 2
    assert.strictEqual(sudoku1[0][1].value, 2);

    // possibilities at 0, 3 should be [3-9]
    assert.deepStrictEqual(sudoku1[0][3].possible, [3, 4, 5, 6, 7, 8, 9]);

    // value at 1, 0 is null
    assert.strictEqual(sudoku1[1][0].value, null);

    const sudoku2 = parseSudoku(testSudoku2);

    // value at 2, 0 is 1
    assert.strictEqual(sudoku2[2][0].value, 1);
    // no possibilities since value is set already
    assert.deepStrictEqual(sudoku2[2][0].possible, []);

    // value at 2, 1 is 4
    assert.strictEqual(sudoku2[2][1].value, 4);
});
