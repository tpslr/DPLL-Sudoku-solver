// ESModule compatible bindings for the native addon will go here
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const importPath = process.env.NODE_ENV == "development" 
    ? process.env.COVERAGE == "true"
        ? "./build/coverage/DPLL.node"
        : "./build/Debug/DPLL.node"
    : "./build/Release/DPLL.node";

const DPLL = require(importPath);


export default DPLL;
