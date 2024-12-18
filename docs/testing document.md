# Testing

* The DPLL solver is tested tested end-to-end using example CNF inputs.  
  - Test coverage of the DPLL solver is 96.1%. (There are some code paths that would be taken in edge cases that I haven't actually ever seen happen)
  - The example inputs can be found in [tests/cnf](../tests/cnf).
  - The .cnf files will be the test input, and .solution files will be the expected result. The files ending in _converted are used for testing the CNF parser and are there to make sure it's converting them to the correct data structures for the DPLL implementation.

* The CNF parser is tested using example inputs and outputs (the same files used for DPLL solver tests, and the tests are ran at the same time)
  - Test coverage for the parser is 100%

* Sudoku parser and Sudoku => CNF converter are tested with unit tests
  - Test coverage of used code for these is 100%, allthough there is some currently unused code that isn't tested, bringing the total coverage for the Sudoku parser to 94.7%.


In addition to these, there are additional tests which test solving a Sudoku end-to-end and verify that it's solved correctly.

The GUI or CLI code is not tested in any way.

Total coverage for all tested code is 96.4%.


Tests can be repeated by running `npm test`, and the coverage report can be generated by running `coverage.sh` (coverage reports only work when ran on linux)

**Note to running tests:** The tests seemingly occasionally hang on windows systems, if they get stuck for longer than a reasonable time (>15 seconds on a modern computer), please kill them and re-run.

**Note to running coverage measurements:** The coverage for JS/TS code is generated using an experimental NodeJS coverage system, and doesn't generate correctly using NodeJS 20 (line numbers will be off). Consider using NodeJS 22. 