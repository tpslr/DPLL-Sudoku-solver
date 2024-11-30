import type { SudokuParseResult } from "../sudokuParser.js";
import { Sudoku, SudokuSolveResult } from "../sudoku.js";

const boardElem: HTMLDivElement = document.getElementById("board") as HTMLDivElement;
const board: Cell[][] = [];
const cellsByValue: Set<Cell>[] = [];

let selector: HTMLDivElement;

const boardSize = 9;

let hideUniqueValues = false;


class Cell {
    readonly x: number;
    
    readonly y: number; 

    private _value: number | undefined;

    private _sure = false;

    private _error = false;

    private _possible: number[];

    private uniques: number[] | undefined;
    
    elem: HTMLDivElement;

    private input: HTMLInputElement;


    possible_elem: HTMLDivElement;

    constructor(x: number, y: number) {
        this._possible = Cell.allPossible;
        this.x = x; this.y = y;
        this.elem = document.createElement("div");
        this.elem.className = "cell";
        if (x % 3 == 0) {
            this.elem.classList.add("gridcell-x-left");
        } else if ((x + 1) % 3 == 0) {
            this.elem.classList.add("gridcell-x-right");
        }
        if (y % 3 == 0) {
            this.elem.classList.add("gridcell-y-top");
        } else if ((y + 1) % 3 == 0) {
            this.elem.classList.add("gridcell-y-bottom");
        }
        this.input = document.createElement("input");
        this.input.maxLength = 1;
        this.input.type = "number";
        this.elem.appendChild(this.input);
        this.possible_elem = document.createElement("div");
        this.elem.appendChild(this.possible_elem);
        boardElem.appendChild(this.elem);
        board[x][y] = this;
        applyNavigationEventHandlers(this.input, x, y, focus => this.focus(focus));
        this.input.oninput = () => {
            if (this.sure) this.input.value = this.value?.toString() ?? "";
            if (this.input.value.length > 1) this.input.value = this.input.value.split("")[0];
            if (this.value) {
                Cell.highlightAllPossible(false, this.value);
                Cell.semifocusAllOfValue(false, this.value);
            }

            this.value = Number(this.input.value);
            if (!this.value) { 
                this.elem.classList.remove("semifocus", "possible");
                return;
            }
            Cell.semifocusAllOfValue(true, this.value);
            Cell.highlightAllPossible(true, this.value);

            validateUniques();
        };
    }

    select() {
        this.input.focus();
    }

    focus(on: boolean) {
        if (on) this.myNeighbors.forEach(neighbor => neighbor.elem.classList.add("highlight"));
        else this.myNeighbors.forEach(neighbor => neighbor.elem.classList.remove("highlight"));

        if (this.value) {
            Cell.semifocusAllOfValue(on, this.value);
            Cell.highlightAllPossible(on, this.value);
        }
    }

    static semifocusAllOfValue(focus: boolean, value: number) {
        if (focus) cellsByValue[value].forEach(cell => cell.elem.classList.add("semifocus"));
        else cellsByValue[value].forEach(cell => cell.elem.classList.remove("semifocus"));
    }

    static highlightAllPossible(focus: boolean, value: number) {
        board.forEach(row => { 
            row.forEach(cell => {
                if (focus && cell.possible.includes(value) && !cell.value) {
                    cell.elem.classList.add("possible");
                } else {
                    cell.elem.classList.remove("possible");
                }
            });
        });
    }

    get value() {
        return this._value;
    }

    set value(value: number | undefined) {
        this.setValue(value);
    }

    setValue(value: number | undefined, validate = true) {
        if (!value || value == 0) value = undefined;

        if (this._value) {
            if (cellsByValue[this._value]?.has(this)) cellsByValue[this._value].delete(this);
        }

        if (value) {
            cellsByValue[value].add(this);
        }
        
        this._value = value;

        this.input.value = value?.toString() ?? "";

        if (validate) this.validate(true);
    }

    set possible(possible: number[]) {
        this._possible = possible;
        this.updatePossible();
    }

    get possible() {
        return this._possible;
    }

    getUniques(cells: Cell[], uniques: number[]) {
        uniques.push(...Cell.allPossible.filter(value => {
            return cells.find(cell => cell !== this && cell.possible.includes(value) && (!cell.value || cell.value === value)) === undefined;
        }).filter(val => !uniques.includes(val)));
    }

    validateUniques() {
        this.uniques = [];

        this.getUniques(this.myRow, this.uniques);
        this.getUniques(this.myColumn, this.uniques);
        this.getUniques(this.mySquare, this.uniques);

        if (this.uniques.length > 1) {
            this.error = true;
        }
        if (this.uniques.length === 0) {
            this.uniques = undefined;
        }
        this.updatePossible();
    }

    validate(propagate: boolean) {
        if (this.value && !this.possible.includes(this.value)) {
            this.error = true;
        } else {
            this.error = false;
        }

        if (!this.sure) {
            this.possible = Cell.allPossible;
            this.uniques = undefined;
        }

        this.myNeighbors.forEach(neighbor => {
            if (neighbor == this) return;

            if (neighbor.value) {
                this.removePossible(neighbor.value);

                if (this.value === neighbor.value) {
                    this.error = true;
                    neighbor.error = true;
                    return;
                }
            }
                
            if (propagate) {
                neighbor.validate(false);
            } else if (this.value) {
                neighbor.removePossible(this.value);
            }
        });
    }

    updatePossible() {
        const possible = this.possible.map(value => {
            const gray = this.uniques !== undefined && !this.uniques.includes(value);

            const xPosition = (value - 1) % 3 * 16 + 8;
            const yPosition = Math.floor((value - 1) / 3) * 16 + 8;

            const colour = gray
                ? "#A0A0A0"
                : "#000000";

            return `<text x="${xPosition}" y="${yPosition}" dy="12px" fill="${colour}">${value}</text>`;
        });

        const content = `<svg viewBox="0 0 58 58">${possible.join()}</svg>`;

        this.possible_elem.innerHTML = !this.value 
            ? content
            : "";
    }

    removePossible(value: number) {
        if (this.possible.includes(value)) {
            this.possible.splice(this.possible.indexOf(value), 1);
            this.updatePossible();
        }
    }

    clear() {
        this.sure = false;
        this.error = false;
        this.setValue(undefined, false);
        this.uniques = undefined;
        this.possible = Cell.allPossible;
    }

    set sure(sure: boolean) {
        const value = this.value;
        this._sure = sure;
        if (sure) {
            if (!value) throw new Error("Cell was set to sure, but no value exists!");

            this.elem.classList.add("sure");
            this.possible = [value];
            this.myNeighbors.forEach(neighbor => {
                if (neighbor == this) return;
                if (neighbor.possible.includes(value)) {
                    neighbor.possible.splice(neighbor.possible.indexOf(value), 1);
                    neighbor.updatePossible();
                }
            });
        } else {
            this.elem.classList.remove("sure");
        }
    }

    get sure() {
        return this._sure;
    }

    set error(error: boolean) {
        this._error = error;
        if (error) {
            this.elem.classList.add("error");
        } else {
            this.elem.classList.remove("error");
        }
    }

    get error() {
        return this._error;
    }

    get myNeighbors() {
        return this.myRow.concat(this.myColumn).concat(this.mySquare);
    }

    get mySquare(): Cell[] {
        const sx = Math.floor(this.x / 3);
        const sy = Math.floor(this.y / 3);
        return Array.prototype.concat(...board.slice(sx * 3, sx * 3 + 3).map(arr => arr.slice(sy * 3, sy * 3 + 3)));
    }

    get myRow() {
        return board.map(value => value[this.y]);
    }

    get myColumn() {
        return board[this.x];
    }

    static get allPossible() {
        return [...Array(boardSize)].map((_, i) => i + 1);
    }
}

function applyNavigationEventHandlers(input: HTMLInputElement, x: number, y: number, focus: (focus: boolean) => void) {
    input.onfocus = () => {
        selector.style.opacity = "1";
        selector.style.left = x / boardSize * 100 + "%";
        selector.style.top = y / boardSize * 100 + "%";
        focus(true);
    };
    input.onblur = () => {
        selector.style.opacity = "0";
        focus(false);
    };
    input.onkeydown = (evt) => {
        if (evt.ctrlKey && evt.code === "Backspace") {
            board[x][y].sure = false;
            evt.preventDefault();
        }

        if (evt.shiftKey) {
            const match = evt.code.match(/Digit(\d)/);
            if (!match) return;

            const cell = board[x][y];
            const number = parseInt(match[1]);
            if (cell.possible.includes(number)) {
                cell.removePossible(number);
            } else {
                cell.possible.push(number);
                cell.updatePossible();
            }
        }

        if (evt.code.includes("Arrow")) { 
            evt.preventDefault();
            let offset = [0, 0];
            switch (evt.code) {
            case "ArrowLeft":
                if (x <= 0) return;
                offset = [-1, 0];
                break;
            case "ArrowRight":
                if (x >= boardSize - 1) return;
                offset = [1, 0];
                break;
            case "ArrowUp":
                if (y <= 0) return;
                offset = [0, -1];
                break;
            case "ArrowDown":
                if (y >= boardSize - 1) return;
                offset = [0, 1];
                break;
            }
            board[x + offset[0]][y + offset[1]].select();
        }
    };
}

function genBoard() {
    for (let i = 0; i < boardSize; i++) {
        cellsByValue[i + 1] = new Set<Cell>();
    }

    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            if (!board[x]) board[x] = [];
            new Cell(x, y);
        }
    }

    selector = document.createElement("div");
    selector.className = "selector";
    selector.style.width = "calc(" + 1 / boardSize * 100 + "%)";
    selector.style.height = "calc(" + 1 / boardSize * 100 + "%)";
    boardElem.appendChild(selector);
}
function loadArray(arr: (number | undefined)[][]) {
    for (const x in arr) {
        for (const y in arr[x]) {
            board[y][x].value = arr[x][y];
        }
    }
    setSure();
}
function setSure() {
    for (const x in board) {
        for (const y in board[x]) {
            const cell = board[x][y];
            if (cell.value) { 
                cell.sure = true;
            } else {
                cell.sure = false;
            }
        }
    }
}

async function validateValues() {
    for (const x in board) {
        for (const y in board[x]) {
            const cell = board[x][y];
            cell.validate(true);
            await new Promise(res => requestAnimationFrame(res));
        }
    }
    validateUniques();
}

async function validateUniques() {
    if (hideUniqueValues) for (const row of board) {
        for (const cell of row) {
            cell.validateUniques();
        }
        await new Promise(res => requestAnimationFrame(res));
    }
}

function clearBoard() {
    for (const x in board) {
        for (const y in board[x]) {
            const cell = board[x][y];
            cell.clear();
        }
    }
}

function init() {
    genBoard();

    loadArray([
        [ , , ,9,1, , , , ],
        [9, , ,6, , ,3, , ],
        [ ,8,3, ,5, , ,7, ],
        [ , , , , , , , ,5],
        [ , , , , , , , , ],
        [2, , , , ,1,4, ,7],
        [1, ,2, ,7, ,6, , ],
        [ , ,4, , , ,2,9, ],
        [ , , , ,6, , , , ]])
    board[0][0].select();
}
init();

async function solve() {
    const sudoku: Sudoku = [];

    for (const x in board) {
        sudoku[x] = [];
        for (const y in board[x]) {
            sudoku[x][y] = {
                value: board[x][y].value ?? null,
                possible: board[x][y].possible
            };
        }
    }


    const res = await fetch("./solve", { 
        method: "POST",
        body: JSON.stringify(sudoku),
        headers: [["Content-Type", "application/json"]]
    });
    const result = await res.json() as SudokuSolveResult;

    if (result.result === "UNSATISFIABLE") {
        alert(result);
        return;
    }

    for (const x in board) {
        for (const y in board[x]) {
            board[x][y].value = result.result[x][y].value ?? undefined;
        }
    }

    displaySolvingStats(result);
}

function displaySolvingStats(result: SudokuSolveResult) {
    const statsElem = document.getElementById("statistics");
    if (!statsElem) throw new Error();

    const numberFormatter = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

    const totalTime = numberFormatter.format(result.conversionTime + result.parsingTime + result.solvingTime);

    const conversionTime = numberFormatter.format(result.conversionTime);
    const parsingTime = numberFormatter.format(result.parsingTime);
    const solvingTime = numberFormatter.format(result.solvingTime);

    statsElem.innerHTML = `<h4>Solving statistics</h4>
        Total time         ${totalTime}ms<br>
        Sudoku conversion: ${conversionTime}ms<br>
        CNF parsing:       ${parsingTime}ms<br>
        Solving:           ${solvingTime}ms<br>
        <b>Result:</b> ${result.satisfiable
            ? "SATISFIABLE" 
            : "UNSATISFIABLE"}`;
}

async function hideUniques(value: boolean) {
    hideUniqueValues = value;
    if (value) {
        validateUniques();
    } else {
        validateValues();
    }
}

async function importClipboard() {
    const text = await navigator.clipboard.readText();

    const res = await fetch("./parse", { 
        method: "POST",
        body: text,
        headers: [["Content-Type", "text/plain"]]
    });

    const result = await res.json() as SudokuParseResult;

    if ("error" in result) {
        alert(result.error);
        return;
    }

    clearBoard();

    for (const x in board) {
        for (const y in board[x]) {
            board[x][y].setValue(result.sudoku[x][y].value ?? undefined, false);
            board[x][y].possible = result.sudoku[x][y].possible;
        }
    }

    setSure();

    validateValues();
}

async function importFile() {

}

export { clearBoard, setSure, solve, importClipboard, importFile, hideUniques };
