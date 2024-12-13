import test from "node:test";
import assert from "node:assert";
import { SudokuCNFConverter } from "../sudokuCnfConverter.js";
import { Sudoku } from "../sudoku.js";


test("SudokuCNFConverter/posToLiteral", () => {
    const converter = new SudokuCNFConverter([]);

    assert.strictEqual(converter.posToLiteral(0, 0, 1), 1);

    assert.strictEqual(converter.posToLiteral(0, 0, 5), 2);

    assert.strictEqual(converter.posToLiteral(0, 0, 1), 1);

    assert.strictEqual(converter.posToLiteral(0, 0, 2), 3);

    assert.strictEqual(converter.literalCount, 3);
});

test("SudokuCNFConverter/createXOR", () => {
    const converter = new SudokuCNFConverter([]);
    
    {
        const output = converter.createXOR([1, 2, 3]);
        const expected = "1 2 3 0\n-1 -2 0\n-1 -3 0\n-2 -3 0\n";

        assert.strictEqual(output, expected);
    }
    {
        const output = converter.createXOR([7, 2, 10]);
        const expected = "7 2 10 0\n-7 -2 0\n-7 -10 0\n-2 -10 0\n";

        assert.strictEqual(output, expected);
    }
    {
        const output = converter.createXOR([1, 2, 3, 4]);
        const expected = "1 2 3 4 0\n-1 -2 0\n-1 -3 0\n-1 -4 0\n-2 -3 0\n-2 -4 0\n-3 -4 0\n";

        assert.strictEqual(output, expected);
    }
});


/**
 * Generates a test sudoku from string, and leaves all "." as 
 * "any possible value"
 * @param string 
 */
function generateTestSudoku(string: string) {
    const sudoku: Sudoku = [];

    const rows = string.split("\n");

    for (let row = 0; row < 9; row++) {
        sudoku[row] = [];
        const values = rows[row].split("");
        for (let col = 0; col < 9; col++) {
            sudoku[row][col] = {
                value: values[col] !== "."
                    ? parseInt(values[col])
                    : null,
                possible: values[col] === "."
                    ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
                    : []
            };
        }
    }
    return sudoku;
}


test("SudokuCNFConverter/convert", () => {
    // solution = "435269781\n682571493\n197834562\n826195347\n374682915\n951743628\n519326874\n248957136\n763418259"
    const testSudoku1 = generateTestSudoku(".35269781\n682571493\n197834562\n826195347\n374682915\n951743628\n519326874\n248957136\n763418259");
    
    const converter = new SudokuCNFConverter(testSudoku1);


    const CNF = converter.convert().split(/\n|\r|\r\n/g);

    const expectedLines = ["p cnf 9 64", "c Values for cell 1, 1", "1 2 3 4 5 6 7 8 9 0"];

    assert(expectedLines.length < CNF.length, "Resulting CNF should have at least as many lines as expected output");
});

test("SudokuCNFConverter/parseResult", () => {
    // solution = "435269781\n682571493\n197834562\n826195347\n374682915\n951743628\n519326874\n248957136\n763418259"
    const testSudoku1 = generateTestSudoku("..5269781\n682571493\n197834562\n826195347\n374682915\n951743628\n519326874\n248957136\n763418259");

    const converter = new SudokuCNFConverter(testSudoku1);

    converter.convert();

    const result = converter.parseResult("4 -2 -3 12 -13 -14 -15 0");

    assert.strictEqual(result[0][0].value, 4);
    assert.strictEqual(result[0][1].value, 3);
});
