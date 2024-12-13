#!/bin/bash


if [ ! -d "DPLL/build" ]; then
  echo "Folder \"DPLL/build\" doesn't exist!"
  echo "You should probably run \"npm i\" first!"
  exit 1
fi

cd "DPLL/build"

rm ./DPLL/build/coverage/obj.target/DPLL/DPLL.gcno
rm ./DPLL/build/coverage/obj.target/DPLL/bindings.gcno

echo "Building DPLL with coverage enabled"
export BUILDTYPE=coverage
make DPLL --always-make

cd ../..

echo "Running tests"
export NODE_ENV=development 
export COVERAGE=true
npm run coverage

echo "Generating coverate report"
gcov DPLL.cpp -r -o ./DPLL/build/coverage/obj.target/DPLL
lcov --capture --directory . --output-file coverage.info
rm *.cpp.gcov
genhtml coverage.info jscoverage.info --output-directory coverage
rm coverage.info
rm jscoverage.info

echo "Done"
echo "Coverage reports can be found in \"./coverage\""