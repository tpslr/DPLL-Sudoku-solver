// TypeScript types for the native addon will go here

declare module DPLL {
    export function solve(valueCount: number, clauses: Buffer[]): Buffer | string;
}

export default DPLL