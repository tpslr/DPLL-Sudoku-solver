import { readFile } from "fs/promises";
import { solveCNF } from "./cnf.js";

import { parseSudoku, simplifySudoku } from "./sudokuParser.js";
import { printSudoku, solveSudoku, Sudoku } from "./sudoku.js";

import { resolve as resolvePath } from "path";

import assert from "node:assert";

import express from "express";
import bodyParser from "body-parser";
const app = express();


app.use(express.static("./static"));

app.get("/index.js", (req, res) => {
    res.sendFile("./frontend/index.js", { root: import.meta.dirname });
});
app.get("/index.js.map", (req, res) => {
    res.sendFile("./frontend/index.js.map", { root: import.meta.dirname });
});
app.get("/src/frontend/index.ts", (req, res) => {
    res.sendFile("./src/frontend/index.ts", { root: resolvePath(import.meta.dirname, "..") });
});

app.post("/solve", bodyParser.json(), (req, res) => {
    const response = solveSudoku(req.body);
    res.send(response);
});


app.post("/parse", bodyParser.text(), (req, res) => {
    try {
        const result = parseSudoku(req.body);
        res.send(result);
    } catch {
        res.send({
            error: "Parse error"
        });
    }
});


const opts = {
    port: 5001,
};


for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--solvecnf") {
        const cnfFile = process.argv[++i];
        console.log(solveCNF(cnfFile));
        process.exit();
    } else if (arg === "--solvesudoku") {
        const nextArg = process.argv[++i];

        // eslint-disable-next-line no-useless-escape
        const data = nextArg.length === 81 && nextArg.match(/^[\d\.xX]*$/)
            ? nextArg // arg is sudoku string
            : await readFile(nextArg, "utf-8"); // arg is anything else (assume it's a file path)

        let sudoku: Sudoku | null = null;

        try {
            const result = parseSudoku(data);
            sudoku = result.sudoku;
            console.log(`Sudoku file parsed as ${result.format}`);
            printSudoku(sudoku);
        } catch {
            console.error(`Unable to parse sudoku from ${nextArg}!`);
            process.exit(1);
        }

        simplifySudoku(sudoku);
        
        const solved = solveSudoku(sudoku);

        const numberFormatter = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

        const totalTime = numberFormatter.format(solved.conversionTime + solved.parsingTime + solved.solvingTime);
        const conversionTime = numberFormatter.format(solved.conversionTime);
        const parsingTime = numberFormatter.format(solved.parsingTime);
        const solvingTime = numberFormatter.format(solved.solvingTime);


        console.log(`Solved in ${totalTime}ms (conversion ${conversionTime}ms, parsing ${parsingTime}ms, solving ${solvingTime}ms)\n`);
        
        console.log("Result: \n");

        if (solved.result === "UNSATISFIABLE") {
            console.log("UNSATISFIABLE");
        } else {
            printSudoku(solved.result);
        }
        
        process.exit();
    } else if (arg === "--port") {
        const nextArg = process.argv[++i];

        assert(!!nextArg, "Missing a port number after --port");
        assert(nextArg.match(/^\d{1,5}$/g), "Port must be an integer with lengh (1-5)");

        const port = parseInt(nextArg);

        assert(port <= 65535 && port > 0, "Port must be in the range (1-65535)");

        opts.port = port;
    }
}


const server = app.listen(opts.port, () => {
    let address = server.address();
    if (typeof address === "object" && address !== null) {
        address = `http://localhost:${address.port}`;
    }
    console.log(`Listening on ${address}`);
});

