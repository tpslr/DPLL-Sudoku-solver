## How it works

1. A Sudoku is imported and parsed into a 2 dimensional array
    * While the Sudoku is being parsed, candidates for all cells are generated.
    * Candidates are generated based on the basic Sudoku rules and don't account for any special Sudoku stradegies.
    * Rules used:
        * Numbers 1-9 on each row, col, and square.
        * A cell can only have one value. (This rule actually only gets applied only at the Sudoku => CNF conversion step)
        * A row, col or square can't have duplicate values
3. The candidate values are converted into a conjunctive normal form boolean satisfiability problem (SAT problem)
    * This will just be an encoding of which numbers can exist where, throwing out all cells that already had values.
    * The rules explained before will also be included in the generated CNF, but only for cells that need to be solved.
    * This step stores the literal IDs used for each row/col/value pair, to be used at step 5.
4. This SAT problem is then solved using a DPLL algorithm optimized for this purpose
    * The DPLL algorithm differs from a regular DPLL algorithm, since it will do pure literal assignment and value propagation until no difference is observed before it starts choosing literals to assign.  
    This approach speeds up solving Sudokus, since most Sudokus will just recursively simplify into the solution, and can be solved without ever having to choose a random value.
5. The results of the SAT problem are then parsed back into a 2 dimensional array using the literal IDs from step 3.  
    The solution to the Sudoku is then displayed to the user in the GUI or printed on the terminal if used on the command line.

## Performance
I've achieved my performance goal of solving to solve an average Sudoku practically instantly, and harder Sudokus in less than half a second. 
This performance is seemingly comparable to well known Sudoku solvers.
(This of course depends on computer performance, but these numbers should apply to basically any modern computer)