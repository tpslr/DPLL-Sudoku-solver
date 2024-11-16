# Week 3 report

## Progress
DPLL solver is almost completely functional, still has some issues where it sometimes randomly hangs, especially on longer solves.  
I have set up some basic tests for the DPLL solver and CNF parser that compare the output to expected output generated from the kissat SAT solver.  
I have created a basic bash script to generate coverage stats for the C++ code.  
I have set up ESLint to maintain code quality  
Started writing a [testing document](./testing%20document.md) (it's at very early state)
Started writing a [installation/usage guide](./guide.md) (same, very early state)

## Learning
* I have learned how to configure and use ESLint
* I have learned how to use gcov to generate C++ code coverage reports
* I have learned how to create tests using node:test

## Next
* Write more specific and detailed unit tests for more parts of the code
* Slightly change how testing on the DPLL part is done, since SAT problems might have multiple correct solutions
* Make sure the program is easily able to be ran by others
* Sudoku UI and converting a Sudoku to a CNF SAT problem

## Time spent this week
Approximately 18 hours

## Questions
Should I be writing tests for the individual parts of the DPLL algorithm?
Some of those tests would be a massive pain to write since the input and output data is massive and complex