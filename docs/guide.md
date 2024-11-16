# Guide


## Installation
* clone the repository
* install NodeJS (I've tested using node 20.17.0 and 22.11.0 but anything >20 should work)
* install some C++ compiler that node-gyp supports (g++, msvc, etc)
* `npm i`
* `tsc` (if you don't have typescript globally installed, it should be under node_modules/typescript/bin/tsc)

If you are having issues with the `npm i` step, you might have to run `cd DPLL && npm i && npm run build && cd .. && npm i`, some things don't yet install properly depending on which OS and C++ compiler you have


## Usage
Currently the program cannot yet take any user-specified input.  
You can run the tests using `npm test`.  
You can generate the test coverage report by running `./coverage.sh` (this requires you to be using linux and having g++ and gcov installed)


  
---
might not run on Windows.