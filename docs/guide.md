# Guide


## Installation
* clone the repository
* install NodeJS (I've tested using node 20.17.0 and 22.11.0 but anything >20 should work)
* install some C++ compiler that node-gyp supports (g++, msvc, etc)
* `npm i`
* `tsc` (if you don't have typescript globally installed, it should be under node_modules/typescript/bin/tsc)

If you are having issues with the `npm i` step, you might have to run `cd DPLL && npm i && npm run build && cd .. && npm i`, some things don't yet install properly depending on which OS and C++ compiler you have


## Usage
Run the app using `node .` and navigate to `localhost:5001` a web browser


Solve a sudoku from a file by running `node . --solvesudoku <path to file>`  
Supported sudoku formats: SadMan, SimpleSudoku, 81-char format, VBForums, potentially some others too

Solve a sudoku on the command line by running `node . --solvesudoku <sudoku in 81-char format>`  
Example: `node . --solvesudoku 1.8..6.3..6...84...4..1.5..5836...14........3....9......4.......1...3..7..61.7..8`


Solve a CNF SAT problem on the command line by running `node . --solvecnf <path to cnf file>`


You can run the tests using `npm test`.  
You can generate the test coverage report by running `./coverage.sh` (this requires you to be using linux and having g++ and gcov installed)


  
---
might not run on Windows.