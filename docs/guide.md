# Guide


## Installation
* clone the repository
* install NodeJS (I've tested using node 20.17.0 and 22.11.0 but anything >20 should work)
* install some C++ compiler that node-gyp supports (g++, msvc, etc)
* `npm i`
* `tsc` (if you don't have typescript globally installed, it should be under node_modules/typescript/bin/tsc)

If you are having issues with the `npm i` step, you might have to run `cd DPLL && npm i && npm run build && cd .. && npm i`, some things don't yet install properly depending on which OS and C++ compiler you have

### Note for installation on Windows
You need to have Visual Studio > 2017 with C++ build support (or microsoft build tools) installed for the C++ parts to compile


## Usage
Run the app using `node .` and navigate to `localhost:5001` a web browser (or specify some other port by adding `--port <number>`)


Solve a sudoku from a file by running `node . --solvesudoku <path to file>`  
Supported sudoku formats: SadMan, SimpleSudoku, 81-char format, VBForums, potentially some others too

Solve a sudoku on the command line by running `node . --solvesudoku <sudoku in 81-char format>`  
Example: `node . --solvesudoku 1.8..6.3..6...84...4..1.5..5836...14........3....9......4.......1...3..7..61.7..8`


Solve a CNF SAT problem on the command line by running `node . --solvecnf <path to cnf file>`


You can run the tests using `npm test`.  
You can generate the test coverage report by running `./coverage.sh` (this requires you to be using linux and having g++ and gcov installed)


## WebUI instructions
Import a new sudoku from clipboard using the `import from keyboard` button.  
Most commonly used sudoku formats are supported, a useful tool you can use to generate sudokus is [qqwing](https://qqwing.com/generate.html).

Use the `set sure` button to set all current values as "sure" values (the starting values of the sudoku).  
(You would use this if you've manually entered a sudoku in, and doing this is not required for solving to work, it's purely a UI change)

To undo a "sure" value, press <kbd>Shift</kbd> + <kbd>Backspace</kbd>.

Navigate the Sudoku grid by clicking on the squares, using arrow keys, or using tab.

Add/Remove candidate values using <kbd>Shift</kbd> + Number keys. (Values set in this way may get reverted when the sudoku is automatically revalidated as you modify values of cells).

Use the `Hide candidates for uniques` to hide candidate values if there's only one position in a row/column/square where that value can go.
(GUI only, makes no difference in solving)  
This will also make the program catch more errors while entering a sudoku.

Revalidate a sudoku cell by pressing <kbd>h</kbd> (mostly shouldn't be needed)

  
---
*should* not run on Windows, still a tiny bit unsure.