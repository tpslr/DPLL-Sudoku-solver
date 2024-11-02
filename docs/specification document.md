# DPLL Sudoku solver

## Description
The program solves a normal 9x9 sudoku puzzle using the DPLL algorithm.
As input, it will take a sudoku in either a GUI, or as text representation and converts it to CNF (conjuctive normal form) which can be solved using the DPLL algorithm. The solution of the sudoku will them be shown in the GUI.
The core part of this project will be implementation of the DPLL algorithm, and the conversion of a sudoku into CNF.

## Language
* The GUI and sudoku-related parts will be written in TypeScript (+HTML) and will run using NodeJS.
* The DPLL algorithm will be written in C++ as a NodeJS native module (using node-gyp and napi).

## Course related info
* **Study program**  
    Tietojenkäsittelytieteen kandidaatti (TKT)
* **Documentation language**  
    English (I do speak Finnish but will be writing docs in english)
* **Peer review languages**  
    Python, C++, C#, JavaScript, TypeScript
