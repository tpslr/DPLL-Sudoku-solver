import type { Sudoku } from "./sudoku.js";

/**
 * Parses a sudoku in 
 * @param data 
 * @returns 
 */
function parseSudoku(data: string) {
    const lines = data.split(/\r\n|\r|\n/g);

    const sudoku: Sudoku = [];

    for (let row = 0; row < 9; row++) {
        sudoku[row] = [];
        const cells = lines[row].split("");
        for (let col = 0; col < 9; col++) {
            sudoku[row][col] = {
                value: cells[col] === "." 
                    ? null
                    : parseInt(cells[col]),
                possible: [1, 2, 3, 4, 5, 6, 7, 8, 9]
            };
        }
    }

    // simplify the sudoku (speeds up solving later on as the generated SAT problem will have less clauses)
    removeImpossibleValues(sudoku);
    fillObviousValues(sudoku);
    removeImpossibleValues(sudoku);

    return sudoku;
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

export { parseSudoku };
