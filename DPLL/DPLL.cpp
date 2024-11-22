#include <stdlib.h>
#include <cstdint>
#include <vector>
#include <./DPLL.h>
#include <string.h>
#include <thread>

#ifdef _MSC_VER
// windows is different so this is needed 
#include <intrin.h>
#define __builtin_popcountll __popcnt64
#define __builtin_ctzll _tzcnt_u64
#endif

uint32_t clauseCount;
uint32_t valueCount;
uint32_t value64Count;

uint64_t* solution;
bool solutionFound;

bool* pureLiteralClauseDiscardCache;

std::mutex runningMutex;
uint32_t workerCount = 30;
Worker *workers;


inline void setLiteral(dpllState &state, uint32_t literal, bool value) {
    uint32_t base = literal >> 6;
    uint32_t offset = literal & 63;
    if (state.visitedLiterals[base] & (1ull << offset)) return;
    state.visitedLiterals[base] |= 1ull << offset;
    if (value) {
        state.literals[base] |= (((uint64_t)1) << offset);
    }
    else {
        state.literals[base] &= ~(((uint64_t)1) << offset);
    }

    // discard all clauses that become true by setting value
    for (uint32_t i = 0; i < clauseCount; ++i) {
        if (state.discardedClauses[i]) continue; // skip clauses were already discarded

        uint64_t* clause = state.clauses->at(i);
        
        if ((clause[base * 2] & (1ull << offset)) != 0 // clause has literal
            && ((clause[base * 2 + 1] & (1ull << offset)) >> offset) != value) { // check clause literal is true (value != clause[literal].negated)
            state.discardedClauses[i] = true; // discard clause, since setting this value made it become true
            state.discardedClausesCount++;
        }
    }
}

inline bool set64True(dpllState &state, uint32_t index, uint64_t value) {
    if (value == 0) return false;
    state.visitedLiterals[index] |= value;

    state.literals[index] |= value;

    // discard all clauses that become true by setting value
    for (uint32_t i = 0; i < clauseCount; ++i) {
        if (state.discardedClauses[i]) continue; // skip clauses were already discarded

        uint64_t* clause = state.clauses->at(i);

        if (clause[index * 2] & ~clause[index * 2 + 1] & value) {
            state.discardedClauses[i] = true;
            state.discardedClausesCount++;
        }
    }
    return true;
}

inline bool set64False(dpllState &state, uint32_t index, uint64_t value) {
    if (value == -1ull) return false;
    state.visitedLiterals[index] |= ~value;

    state.literals[index] &= value;

    // discard all clauses that become true by setting value
    for (uint32_t i = 0; i < clauseCount; ++i) {
        if (state.discardedClauses[i]) continue; // skip clauses were already discarded

        uint64_t* clause = state.clauses->at(i);

        if (clause[index * 2] & clause[index * 2 + 1] & ~value) {
            state.discardedClauses[i] = true;
            state.discardedClausesCount++;
        }
    }
    return true;
}


inline dpllState* copyState(dpllState& state) {
    bool* discarded_clauses = (bool*)malloc(clauseCount);
    uint64_t* visited_literals = (uint64_t*)malloc(value64Count * sizeof(uint64_t));
    uint64_t* literals = (uint64_t*)malloc(value64Count * sizeof(uint64_t));

    memcpy(discarded_clauses, state.discardedClauses, clauseCount);
    memcpy(visited_literals, state.visitedLiterals, value64Count * sizeof(uint64_t));
    memcpy(literals, state.literals, value64Count * sizeof(uint64_t));

    return new dpllState {
        state.lastLiteral, state.clauses, state.discardedClausesCount, discarded_clauses, visited_literals, literals
    };
}
// Copy state from source to an existing destination state
inline void copyState(dpllState& source, dpllState &destination) {
    memcpy(destination.discardedClauses, source.discardedClauses, clauseCount);
    memcpy(destination.visitedLiterals, source.visitedLiterals, value64Count * sizeof(uint64_t));
    memcpy(destination.literals, source.literals, value64Count * sizeof(uint64_t));

    destination.lastLiteral = source.lastLiteral;
    destination.discardedClausesCount = source.discardedClausesCount;
    destination.clauses = source.clauses;
}

inline void cleanupState(dpllState *state) {
    free(state->discardedClauses);
    free(state->literals);
    free(state->visitedLiterals);
    free(state);
}

inline uint32_t chooseLiteral(dpllState& state) {
    for (uint32_t i = state.lastLiteral; i < valueCount; ++i) {
        if (state.visitedLiterals[i >> 6] & 1ull << (i & 63)) continue; // literal has been visited already
        state.lastLiteral = i;
        return i;
    }
    // reached the end of literals, return -1 to signify that
    return -1;
}

inline bool unitPropagate(dpllState &state) {
    bool change = false;
    for (uint32_t i = 0; i < clauseCount; ++i) {
        if (state.discardedClauses[i]) continue; // skip clauses were already discarded

        uint64_t* clause = state.clauses->at(i);

        uint32_t literalCount = 0;
        uint32_t unitPart = -1;
        uint32_t unitOffset;
        for (uint32_t part = 0; part < value64Count; ++part) {
            // skip clauses that don't include anything in this range
            if (clause[part * 2] == 0) continue;
            
            // all literals that are used in part of clause and aren't set
            uint64_t missingValues = clause[part * 2] & ~state.visitedLiterals[part];

            uint32_t count = __builtin_popcountll(missingValues);
            literalCount += count;
            if (literalCount > 1) {
                // literal count on this clause is greater than 1
                unitPart = -1;
                break;
            }
            if (count == 1) {
                unitPart = part;
                // the offset will be number of leading zeros
                unitOffset = __builtin_ctzll(missingValues);
            }
        }

        if (literalCount == 1) {
            bool value = (clause[unitPart * 2 + 1] & (1ull << unitOffset)) == 0 ? true : false;
            setLiteral(state, unitPart * 64 + unitOffset, value);
            change = true;
        }
    }
    return change;
}

inline bool pureLiteralAssign(dpllState &state) {
    // discarded clauses need to be copied since it can change due to setLiteral
    // current state is needed since everything looped over in chunks

    bool *cache = (bool*)malloc(clauseCount);
    memcpy(cache, state.discardedClauses, clauseCount);

    bool change = false;

    for (uint32_t part = 0; part < value64Count; ++part) {
        uint64_t isPure0 = 0;
        uint64_t isPure1 = (uint64_t)-1;

        for (uint32_t i = 0; i < clauseCount; ++i) {
            if (cache[i]) continue;
            uint64_t* clause = state.clauses->at(i);
            // skip clauses that don't include anything in this range
            if (clause[part * 2] == 0) continue;

            isPure0 |= clause[part * 2] & ~clause[part * 2 + 1];
            isPure1 &= ~clause[part * 2] | ~clause[part * 2 + 1];
        }
        change |= set64False(state, part, isPure0 | state.visitedLiterals[part]);
        change |= set64True(state, part, isPure1 & ~state.visitedLiterals[part]);
    }
    free(cache);
    return change;
}


bool solve(dpllState &state) {
    // The solution was already found somewhere
    // This is needed when using multiple threads, so the other threads exit when the solution is found by one
    if (solutionFound) return false;
    bool change = true;
    while (change) {
        change = false;
        // keep doing unit propagation and pure literal assignment in a loop
        // (with good chances solving for one value makes the next one obvious, so there's no need to recursively guess)
        // this will technically slow down the algorithm in some cases (doing work once, seeing it doesn't solve it, and then choosing to try that literal later)
        change |= unitPropagate(state);
        change |= pureLiteralAssign(state);
    }

    if (state.discardedClausesCount == clauseCount) {
        if (solutionFound) return false;
        solutionFound = true;
        memcpy(solution, state.literals, value64Count * sizeof(uint64_t));

        for (uint32_t i = 0; i < workerCount; i++) {
            workers[i].notifyStop();
        }

        return true;
    }


    uint32_t literal = chooseLiteral(state);
    if (literal == -1) {
        return false;
    }

    dpllState* falseState = &state;
    
    dpllState* trueState = copyState(state);

    SolveResult resultFalse = solve2(falseState, literal, false);
    SolveResult resultTrue = solve2(trueState, literal, true);

    if (getResult(resultFalse) | getResult(resultTrue)) {
        return true;
    }

    cleanupState(trueState);

    return false;
}

inline bool getResult(SolveResult &result) {
    if (result.worker == -1u) return result.result;
    return workers[result.worker].getResult();
}

/**
 * Assigns `literalValue` to `literal` and finds a thread to continue solving from that point
 * If no other thread is free, execution will continue on the current thread
 * @param state The state of the DPLL algoritm 
 * @param literal literal to set
 * @param literalValue value to assign to `literal`
 */
inline SolveResult solve2(dpllState *state, uint32_t literal, bool literalValue) {
    SolveResult result = { -1u, false };
    setLiteral(*state, literal, literalValue);
    
    std::unique_lock<std::mutex> runningLock(runningMutex);

    for (uint32_t i = 0; i < workerCount; i++) {
        if (!workers[i].running) {
            workers[i].run(state);
            result.worker = i;
            break;
        }
    }

    runningLock.unlock();

    if (result.worker == -1u) {
        result.result = solve(*state);
    }
    return result;
}

Worker::Worker() {
    thread = new std::thread([&]{ main(); });
}
void Worker::kill() {
    std::lock_guard<std::mutex> lock(mtx);
    killed = true;
    cv.notify_all();
    doneCv.notify_all();
}

void Worker::notifyStop() {
    cv.notify_all();
    doneCv.notify_all();
}

void Worker::run(dpllState *state) {
    std::lock_guard<std::mutex> lock(mtx);
    this->state = state;
    this->running = true;
    this->done = false;
    this->cv.notify_all();
}

void Worker::main() {
    std::unique_lock<std::mutex> lock(mtx);

    while (!killed && !solutionFound) {
        cv.wait(lock, [&]{ return running || killed; });
        if (killed || solutionFound) {
            break;
        }
        
        result = solve(*state);

        done = true;
        doneCv.notify_all();

        cv.wait(lock, [&]{ return !running || killed || solutionFound; });
    }
    doneCv.notify_all();
    lock.unlock();
}

bool Worker::getResult() {
    std::unique_lock<std::mutex> l(mtx);
    if (!done) doneCv.wait(l, [&]{ return done || solutionFound || killed; });

    bool result = this->result;
    std::unique_lock<std::mutex> runningLock(runningMutex);
    running = false;

    cv.notify_all();
    return result;
}



bool DPLL(std::vector<uint64_t*>& clauses, uint32_t _valueCount, uint64_t* _solution) {
    solutionFound = false;
    
    valueCount = _valueCount;
    value64Count = ((valueCount - 1) >> 6) + 1;

    clauseCount = clauses.size();

    solution = _solution;

    bool* discarded_clauses = new bool[clauseCount]();
    uint64_t* visited_literals = new uint64_t[value64Count]();
    uint64_t* literals = new uint64_t[value64Count]();

    workers = new Worker[workerCount]();

    pureLiteralClauseDiscardCache = new bool[clauseCount]();

    dpllState dpll = {
        0, &clauses, 0, discarded_clauses, visited_literals, literals
    };

    bool result = solve(dpll);

    // Kill all workers since they could still be running on other branches
    for (uint32_t i = 0; i < workerCount; ++i) {
        auto worker = (workers + i);
        worker->kill();
    }
    // Join all threads to make sure they've exited before stopping
    // This is needed to stop segfaults in the case where a thread is still doing something
    // when this function exits and variables go out of scope and get free'd
    for (uint32_t i = 0; i < workerCount; ++i) {
        auto worker = (workers + i);
        worker->thread->join();
    }
    return result;
}