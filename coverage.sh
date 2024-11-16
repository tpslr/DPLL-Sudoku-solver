#!/bin/bash


if [ ! -d "DPLL/build" ]; then
  echo "Folder \"DPLL/build\" doesn't exist!"
  echo "You should probably run \"npm i\" first!"
  exit 1
fi

cd "DPLL/build"

echo "Building DPLL with coverage enabled"
set BUILDTYPE coverage
export BUILDTYPE
make DPLL

cd ../..

echo "Running tests"
set NODE_ENV development 
export NODE_ENV
set COVERAGE true
export COVERAGE
npm test

echo "Generating coverate report"
gcov DPLL.cpp -r -o ./DPLL/build/coverage/obj.target/DPLL
lcov --capture --directory . --output-file coverage.info
rm *.cpp.gcov
genhtml coverage.info --output-directory coverage
rm coverage.info

echo "Done"