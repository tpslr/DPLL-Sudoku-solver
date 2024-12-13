import test from "node:test";
import assert from "node:assert";
import { parseSudoku } from "../sudokuParser.js";
import { readdir, readFile } from "fs/promises";
import { join as joinPath } from "path";
import { checkSudoku } from "./solveSudoku.js";


test("sudokuParser/parseSudoku", async () => {
    const testSudoku1 = "12.......\n.........\n.........\n.........\n.........\n.........\n.........\n.........\n.........\n";
    const testSudoku2 = ".........\n.........\n14.......\n.........\n.........\n.........\n.........\n.........\n.........\n";

    const sudoku1 = parseSudoku(testSudoku1).sudoku;

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

    const sudoku2 = parseSudoku(testSudoku2).sudoku;

    // value at 2, 0 is 1
    assert.strictEqual(sudoku2[2][0].value, 1);
    // no possibilities since value is set already
    assert.deepStrictEqual(sudoku2[2][0].possible, []);

    // value at 2, 1 is 4
    assert.strictEqual(sudoku2[2][1].value, 4);

    const dir = "tests/sudoku";

    const files = await readdir(dir);

    const expected = ".65.....8\n7..86.4..\n....2...9\n.4...1..2\n...2.7...\n3..5...7.\n4...5....\n..1.79..3\n9.....26.";
    
    for (const file of files) {
        const filePath = joinPath(dir, file);
        const data = await readFile(filePath, "utf-8");

        if (file === "invalid.txt") {
            assert.throws(() => {
                parseSudoku(data);
            });
            continue;
        }

        const sudoku = parseSudoku(data).sudoku;

        checkSudoku(sudoku, expected);
    }
});
