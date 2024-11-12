import { readFile, writeFile } from "fs/promises"
import DPLL from "DPLL"



async function loadCNF(path: string) {
    const data = await readFile(path, "utf-8");

    // extract metadata from the "p cnf <variables> <clauses>" line
    const metadata = data.matchAll(/^p cnf (\d+) (\d+)/mg).next().value;
    if (!metadata) throw new Error("Invalid input!, missing 'p cnf <variables> <clauses>' line.");

    const variables = parseInt(metadata[1]);
    const clauses = parseInt(metadata[2]);

    const clauseLen = ((((variables >> 6) + 1) << 6)) * 2;
    console.log(`Variables: ${variables}`);
    console.log(`Clauses: ${clauses}`);

    const lines = data.split(/\r\n|\r|\n/g);


    const clausesArray: Buffer[] = [];

    
    for (const line of lines) {
        // line doesn't begin with number or dash, skip
        if (line.match(/^[^-\d]/)) continue;

        const buffer = Buffer.alloc(clauseLen / 8);

        for (const symbol of line.split(" ")) {
            const negate = symbol.startsWith("-");
            const symbolNumber = Math.abs(parseInt(symbol));

            const index64 = symbolNumber >> 6 << 6;
            const start = index64 * 64 * 2;
            const offset = symbolNumber & 63;

            console.log(`${start + offset}, ${start + offset + 64}`);

            setBufferSymbol(buffer, start + offset, true);
            setBufferSymbol(buffer, start + offset + 64, negate);
        }

        clausesArray.push(buffer)

    }
    const solution = DPLL.solve(variables, clausesArray);
    if (typeof solution === "string") {
        console.log(solution);
        return;
    }
    let out = "";
    let out2 = "";
    for (let i = 0; i < variables; i++) {
        console.log(`Var ${i} = ${getBufferSymbol(solution, i)}`);
        out += `Var ${i} = ${getBufferSymbol(solution, i)}\n`;
        out2 += `${getBufferSymbol(solution, i) == 0 ? "-" : ""}${i}\n`;
    }
    writeFile("out1.txt", out);
    writeFile("out2.txt", out2)
    debugger;
}

function setBufferSymbol(buffer: Buffer, bit: number, value: boolean){
    const index = bit >> 3;
    bit = bit & 7;
    if(value) {
        buffer[index] |= (1 << bit);
    }
    else {
        buffer[index] &= ~(1 << bit);
    }
}
function getBufferSymbol(buffer: Buffer, bit: number){
    const index = bit >> 3;
    bit = bit & 7;
    return (buffer[index] & (1 << bit)) >> bit;
}


loadCNF("./add4.cnf")