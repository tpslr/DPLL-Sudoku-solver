// TypeScript types for the native addon will go here

declare namespace DPLL {
    export function solve(valueCount: number, clauses: Buffer[]): Buffer | "UNSATISFIABLE";
}

export default DPLL;
