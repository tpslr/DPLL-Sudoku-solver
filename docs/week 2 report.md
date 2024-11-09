# Week 2 report

## Progress
I wrote a basic DIMACS CNF file parser to test the DPLL solver with, and started working on the DPLL solver.  
I wrote and tested 3 different implementations of a "DPLL solver", out of which only one actually ended up even being a DPLL solver after I had understood how a DPLL solver is supposed to work.  
The solver has basic functionality, data structures, and some pure literal assignment logic, but doesn't yet function correctly.

## Learning
* I have learned a lot about how a DPLL solver is supposed to work.  
* I have learned about setting up testing and test coverage for TypeScript and C++ code.  
* I found out that for debugging NodeJS native module code, I should change my development environment to Linux to use standard tooling instead of trying to get debugging working with microsoft tools (node-gyp compiles C++ code using MSVC on windows and that makes debugging very hard). 

## Next
* Finish the implementation of the DPLL solver
* Set up tests (including comparing results to some other SAT solver)
* Set up test coverage measurements
* Start work on the Sudoku UI and converting a Sudoku to a CNF SAT problem 

## Time spent this week
Approximately 12 hours