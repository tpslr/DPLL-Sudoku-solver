import type { Sudoku } from "./sudoku.js";


class SudokuCNFConverter {
    // number of literals in the generated cnf
    literalCount;

    // number of clauses in the generated cnf
    clauseCount;

    // Cache for already generated literal numbers
    readonly posLiteralCache: Map<number, number>;

    /**
     * Inverse of posLiteralCache, stores which literal corresponds to which
     * Sudoku row, column, and value.
     * 
     * Used for parsing the results of SAT solving
     */
    readonly literalPosCache: Map<number, { row: number, col: number, value: number }>;

    /**
     * Reference to the sudoku object
     */
    readonly sudoku: Sudoku;

    constructor(sudoku: Sudoku) {
        this.sudoku = sudoku;
        this.literalCount = 0;
        this.clauseCount = 0;
        this.posLiteralCache = new Map();
        this.literalPosCache = new Map();
    }

    /**
     * Takes a row, column, and value and either assigns it a new literal or returns the previously assigned one
     * @returns literal
     */
    posToLiteral(row: number, col: number, value: number) {
        const positionNumber = value * 81 + row * 9 + col;
        let literal = this.posLiteralCache.get(positionNumber);
        if (!literal) {
            literal = ++this.literalCount;
            this.posLiteralCache.set(positionNumber, literal);
            
            const posData = { 
                row, 
                col, 
                value
            };
            this.literalPosCache.set(literal, posData);
        }
        return literal;
    }

    /**
     * Creates a SAT CNF XOR clause for all `literals`
     * The XOR will be constructed using only OR operations so it will
     * consist of multiple 
     * @returns Partial CNF string
     */
    createXOR(literals: number[]) {
        let out = literals.join(" ") + " 0\n";
        this.clauseCount++;
        for (let i = 0; i < literals.length; i++) {
            for (let ii = i + 1; ii < literals.length; ii++) {
                out += `-${literals[i]} -${literals[ii]} 0\n`;
                this.clauseCount++;
            }
        }
        return out;
    }

    /**
     * Converts the Sudoku to a CNF SAT problem in string form
     * 
     * Sudoku is expected to have `sudoku[x][y].possible` already set to the proper possible values,
     * as conversion will not actually include `sudoku[x][y].value` at all.
     * 
     * Giving an input with `sudoku[x][y].possible` set to defaults (all numbers)
     * will result in a CNF that will solve for a random sudoku instead of a specific sudoku
     * @returns CNF in string form
     */
    convert() {
        let cnf = "";
        // cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this.sudoku[row][col];
                if (cell.value) continue;
                cnf += `c Values for cell ${row + 1}, ${col + 1}\n`;
                cnf += this.createXOR(cell.possible.map(value => this.posToLiteral(row, col, value - 1))) + "\n";
            }
        }
        // rows
        for (let rowN = 0; rowN < 9; rowN++) {
            const row = this.sudoku[rowN];

            for (let value = 0; value < 9; value++) {
                const cols: number[] = [];
                for (let colN = 0; colN < 9; colN++) {
                    if (row[colN].possible.includes(value + 1)) {
                        cols.push(colN);
                    }
                }
                if (cols.length == 0) continue;

                cnf += `c Values for row ${rowN + 1}, num=${value + 1}\n`;
                cnf += this.createXOR(cols.map(col => this.posToLiteral(rowN, col, value))) + "\n";
            }
        }
        // columns
        for (let col = 0; col < 9; col++) {
            for (let value = 0; value < 9; value++) {
                const rows: number[] = [];
                for (let row = 0; row < 9; row++) {
                    if (this.sudoku[row][col].possible.includes(value + 1)) {
                        rows.push(row);
                    }
                }
                if (rows.length == 0) continue;

                cnf += `c Values for col ${col + 1}, num=${value + 1}\n`;
                cnf += this.createXOR(rows.map(row => this.posToLiteral(row, col, value))) + "\n";
            }
        }
        // squares
        for (let square = 0; square < 9; square++) {
            const x = Math.floor(square / 3) * 3;
            const y = square % 3 * 3;

            for (let value = 0; value < 9; value++) {
                const squareLiterals: number[] = [];

                for (let row = x; row < x + 3; row++) {
                    for (let col = y; col < y + 3; col++) {
                        if (this.sudoku[row][col].possible.includes(value + 1)) {
                            squareLiterals.push(this.posToLiteral(row, col, value));
                        }
                    }
                }
                if (squareLiterals.length == 0) continue;

                cnf += `c Values for square ${square + 1}, num=${value + 1}\n`;
                cnf += this.createXOR(squareLiterals) + "\n";
            }
        }

        return `p cnf ${this.literalCount} ${this.clauseCount}\n` + cnf;
    }

    /**
     * Parses the results from `resultString`
     * @param resultString DPLL solver result string
     * @returns Solved Sudoku
     */
    parseResult(resultString: string) {
        const values = resultString.split(" ");

        for (const value of values) {
            if (value.startsWith("-") || value === "0") continue;
            
            const literalData = this.literalPosCache.get(parseInt(value));
            if (!literalData) throw new Error("Missing");
            
            this.sudoku[literalData.row][literalData.col].value = literalData.value + 1;
        }
        return this.sudoku;
    }
}

export { SudokuCNFConverter };
