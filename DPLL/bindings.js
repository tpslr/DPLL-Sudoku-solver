// ESModule compatible bindings for the native addon will go here
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const DPLL = require("./build/Release/DPLL.node");

export default DPLL