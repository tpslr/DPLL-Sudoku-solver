import type { Sudoku, SudokuCell } from "./sudoku.js";


/* eslint-disable no-useless-escape */
const match9x9dot = /((?:[\d\.]{9}(?:\r|\n|\r\n)){8}[\d\.]{9})/;

const SandManV1Header = /^\[Puzzle\](?:\r|\n|\r\n)/;
const SandManV2Meta = /^(?:#[ADCBSLU].*(?:\r|\n|\r\n))+/;

const SimpleSudokuV1 = /(?:[Xx\d]{9}(?:\r|\n|\r\n)){8}[Xx\d]{9}/;
const SimpleSudokuV2Row = /(?:[\d\.]{3}\|){2}[\d\.]{3}/;
const SimpleSudokuV2Spacer = /-{9}/;
const SimpleSudokuV4Header = /\*-----------\*/;
/* eslint-enable no-useless-escape */

type SudokuFormat = "SadMan V1" | "SadMan V2" | "SimpleSudoku V4"
                  | "SimpleSudoku V2" | "SimpleSudoku V1" | "81 char Sudoku"
                  | "Malformed 81 char Sudoku" | "VBForums Contest"
                  | "unknown";

function detectFormat(data: string): SudokuFormat {
    if (data.match(SandManV1Header)) {
        return "SadMan V1";
    } else if (data.match(SandManV2Meta)) {
        return "SadMan V2";
    } else if (data.match(SimpleSudokuV4Header)) {
        return "SimpleSudoku V4";
    } else if (data.match(SimpleSudokuV2Row) && data.match(SimpleSudokuV2Spacer)) {
        return "SimpleSudoku V2";
    } else if (data.match(SimpleSudokuV1)) {
        return "SimpleSudoku V1";
    } else if (data.length === 81) {
        const emptyChar = data.match(/\D|0/);
        if (!emptyChar) return "81 char Sudoku";
        if (data.match(new RegExp(`[^\\d${emptyChar}]`))) {
            // has anything other than digit or empty char
            return "Malformed 81 char Sudoku";
        }
        return "81 char Sudoku";
    } else if (data.match(match9x9dot)) {
        return "VBForums Contest";
    }
    return "unknown";
}

interface SudokuParseResult {
    sudoku: Sudoku;
    format: SudokuFormat;
    lax: boolean;
}

/**
 * Parses a sudoku in multiple different text formats
 * @param lax Use lax parsing rules
 * @returns 
 */
function parseSudoku(data: string, lax = false): SudokuParseResult {
    // strip out leading and trailing tabs and spaces
    data = data.replace(/^[ \t]+|[ \t]+$/gm, "");

    // remove empty lines
    data = data.replace(/(?:\r\n|\r|\n)+/g, "\n");

    if (lax) {
        // remove spaces and tabs
        data = data.replace(/[ \t]/g, "");
    }

    const format = detectFormat(data);


    if (format === "81 char Sudoku" || format === "Malformed 81 char Sudoku") {
        return {
            sudoku: parseSudoku81(data),
            format,
            lax
        };
    } else if (format === "SadMan V1") {
        data = data.replace(SandManV1Header, "");
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "SadMan V2") {
        data = data.replace(SandManV2Meta, "");
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "SimpleSudoku V1") {
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "SimpleSudoku V2") {
        data = data.replace(/-----------\n/g, "");
        data = data.replace(/\|/g, "");
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "SimpleSudoku V4") {
        data = data.replace(/\*-----------\*\n/g, "");
        data = data.replace(/\|---\+---\+---\|\n/g, "");
        data = data.replace(/\|/g, "");
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "VBForums Contest") {
        return {
            sudoku: parseSudoku9x9(data),
            format,
            lax
        };
    } else if (format === "unknown") {
        // Replace out everything that's probably not part of the data
        // eslint-disable-next-line no-useless-escape
        data = data.replace(/[^A-Za-z0-9*_\.]/g, "");
        if (data.length === 81) {
            return {
                sudoku: parseSudoku81(data),
                format,
                lax
            };
        }
        if (lax) {
            throw new Error("Unknown format!");
        }
        return parseSudoku(data, true);
    }
    throw new Error("Unknown format!");
}

function createCell(value: string): SudokuCell {
    return {
        value: value.match(/[0-9]/)
            ? parseInt(value)
            : null,
        possible: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    };
}

function parseSudoku81(data: string): Sudoku {
    const sudoku: Sudoku = [];

    for (let row = 0; row < 9; row++) {
        sudoku[row] = [];
        for (let col = 0; col < 9; col++) {
            sudoku[row][col] = createCell(data[row * 9 + col]);
        }
    }
    removeImpossibleValues(sudoku);
    return sudoku;
}

function parseSudoku9x9(data: string): Sudoku {
    const sudoku: Sudoku = [];

    const inputRows = data.split(/\r|\n|\r\n/);

    for (let row = 0; row < 9; row++) {
        sudoku[row] = [];
        const inputCells = inputRows[row].split("");
        for (let col = 0; col < 9; col++) {
            sudoku[row][col] = createCell(inputCells[col]);
        }
    }
    removeImpossibleValues(sudoku);
    return sudoku;
}

/**
 * Simplifies a sudoku to make it take up less space once converted to CNF
 */
function simplifySudoku(sudoku: Sudoku) {
    fillObviousValues(sudoku);
    removeImpossibleValues(sudoku);
}


/**
 * @param sudoku A sudoku object
 * @param row Number of row
 * @returns All values on `row` of `sudoku`
 */
function colValues(sudoku: Sudoku, row: number) {
    const values: number[] = [];
    for (let col = 0; col < 9; col++) {
        const value = sudoku[row][col].value;
        if (value !== null) {
            values.push(value);
        }
    }
    return values;
}

/**
 * Get all values on a column `col`
 * @param sudoku A sudoku object
 * @param col Number of column
 * @returns All values on `col` of `sudoku`
 */
function rowValues(sudoku: Sudoku, col: number) {
    const values: number[] = [];
    for (let row = 0; row < 9; row++) {
        const value = sudoku[row][col].value;
        if (value !== null) {
            values.push(value);
        }
    }
    return values;
}

/**
 * Get all values on a sudoku square (3x3 area)
 * @param sudoku A sudoku object
 * @param x vertical position of square
 * @param y horizontal position of square
 * @returns All values on square `x`, `y` of `sudoku`
 */
function squareValues(sudoku: Sudoku, x: number, y: number) {
    const values: number[] = [];

    for (let row = x; row < x + 3; row++) {
        for (let col = y; col < y + 3; col++) {
            const value = sudoku[row][col].value;
            if (value !== null) {
                values.push(value);
            }
        }
    }
    return values;
}

/**
 * Modifies the `sudoku` object
 * and removes all impossible values from sudoku[x][y].possible
 */
function removeImpossibleValues(sudoku: Sudoku) {
    for (let row = 0; row < 9; row++) {
        const values = colValues(sudoku, row);
        for (let col = 0; col < 9; col++) {
            const cell = sudoku[row][col];
            if (cell.value === null) {
                cell.possible = cell.possible.filter(value => !values.includes(value));
            } else {
                cell.possible = [];
            }
        }
    }
    for (let col = 0; col < 9; col++) {
        const values = rowValues(sudoku, col);
        for (let row = 0; row < 9; row++) {
            const cell = sudoku[row][col];
            if (cell.value === null) {
                cell.possible = cell.possible.filter(value => !values.includes(value));
            } else {
                cell.possible = [];
            }
        }
    }
    for (let square = 0; square < 9; square++) {
        const x = Math.floor(square / 3) * 3;
        const y = square % 3 * 3;
        const values = squareValues(sudoku, x, y);
        
        for (let row = x; row < x + 3; row++) {
            for (let col = y; col < y + 3; col++) {
                const cell = sudoku[row][col];
                if (cell.value === null) {
                    cell.possible = cell.possible.filter(value => !values.includes(value));
                } else {
                    cell.possible = [];
                }
            }
        }
    }
}

/**
 * Modifies the `sudoku` object
 * and fills in all values where there's only one possibility
 */
function fillObviousValues(sudoku: Sudoku) {
    for (const row of sudoku) {
        for (const cell of row) {
            if (cell.possible.length === 1) {
                cell.value = cell.possible[0];
                cell.possible = [];
            }
        }
    }
}

export { parseSudoku, simplifySudoku };
export type { SudokuParseResult };
