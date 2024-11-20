

function parseCNF(cnf: string) {

    // extract metadata from the "p cnf <variables> <clauses>" line
    const metadata = cnf.matchAll(/^p cnf (\d+) (\d+)/mg).next().value;

    if (!metadata) throw new Error("Invalid input!, missing 'p cnf <variables> <clauses>' line.");

    const variableCount = parseInt(metadata[1]);
    const clauseCount = parseInt(metadata[2]);

    const clauseLen = ((((variableCount >> 6) + 1) << 6)) * 2;

    const lines = cnf.split(/\r\n|\r|\n/g);

    const clausesArray: Buffer[] = [];


    for (const line of lines) {
        // line doesn't begin with number or dash, skip
        if (line.match(/^[^-\d]/) || line.length === 0) continue;

        const buffer = Buffer.alloc(clauseLen / 8);

        for (const symbol of line.split(" ")) {
            const negate = symbol.startsWith("-");
            if (symbol === "0") continue;
            const symbolNumber = Math.abs(parseInt(symbol)) - 1;

            const index64 = symbolNumber >> 6 << 6;
            const start = index64 * 2;
            const offset = symbolNumber & 63;

            setBufferSymbol(buffer, start + offset, true);
            setBufferSymbol(buffer, start + offset + 64, negate);
        }

        clausesArray.push(buffer);
    }

    return {
        clauses: clausesArray,
        variableCount,
        clauseCount,
    };
}


function parseSolution(solution: Buffer, variables: number) {
    let out = "";
    for (let i = 0; i < variables; i++) {
        const prefix = getBufferSymbol(solution, i) == 0
            ? "-"
            : "";

        out += `${prefix}${i + 1} `;
    }
    return out + "0";
}


function setBufferSymbol(buffer: Buffer, bit: number, value: boolean) {
    const index = bit >> 3;
    bit = bit & 7;
    if (value) {
        buffer[index] |= 1 << bit;
    } else {
        buffer[index] &= ~(1 << bit);
    }
}

function getBufferSymbol(buffer: Buffer, bit: number) {
    const index = bit >> 3;
    bit = bit & 7;
    return (buffer[index] & 1 << bit) >> bit;
}


export {
    parseCNF,
    parseSolution
};
