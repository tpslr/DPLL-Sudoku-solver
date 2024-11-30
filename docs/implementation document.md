## How it works

1. A sudoku is imported and parsed into a 2 dimensional array
2. The program figures out candidate values for blank cells based on basic rules  
(This happens as part of the parsing step)
3. The candidate values are converted into a conjunctive normal form satisfiability problem
4. This SAT problem is then solved using a DPLL algorithm optimized for this purpose
5. The results of the SAT problem are then parsed back into a 2 dimensional array, which is then displayed to the user as a solved sudoku.
