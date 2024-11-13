#include <stdlib.h>
#include <cstdint>
#include <vector>
#include <./DPLL.h>
#include <string.h>

uint32_t clauseCount;
uint32_t valueCount;
uint32_t value64Count;

uint64_t* solution;

bool* pureLiteralClauseDiscardCache;



inline void setLiteral(dpllState &state, uint32_t literal, bool value) {
    uint32_t base = literal >> 6;
    uint32_t offset = literal & 63;
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


inline dpllState copyState(dpllState& state) {
    bool* discarded_clauses = (bool*)malloc(clauseCount);
    uint64_t* visited_literals = (uint64_t*)malloc(value64Count * sizeof(uint64_t));
    uint64_t* literals = (uint64_t*)malloc(value64Count * sizeof(uint64_t));

    memcpy(discarded_clauses, state.discardedClauses, clauseCount);
    memcpy(visited_literals, state.visitedLiterals, value64Count * sizeof(uint64_t));
    memcpy(literals, state.literals, value64Count * sizeof(uint64_t));

    return {
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

inline void cleanupState(dpllState& state) {
    free(state.discardedClauses);
    free(state.literals);
    free(state.visitedLiterals);
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

inline void unitPropagate(dpllState &state) {
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
        }
    }
}

inline void pureLiteralAssign(dpllState &state) {
    // discarded clauses needs to be copied since it can change due to setLiteral
    // current state is needed since everything looped over in chunks
    memcpy(pureLiteralClauseDiscardCache, state.discardedClauses, clauseCount);

    for (uint32_t part = 0; part < value64Count; ++part) {
        uint64_t isPure0 = 0;
        uint64_t isPure1 = (uint64_t)-1;

        for (uint32_t i = 0; i < clauseCount; ++i) {
            if (pureLiteralClauseDiscardCache[i]) continue;
            uint64_t* clause = state.clauses->at(i);
            // skip clauses that don't include anything in this range
            if (clause[part * 2] == 0) continue;

            isPure0 |= clause[part * 2] & ~clause[part * 2 + 1];
            isPure1 &= ~clause[part * 2] | ~clause[part * 2 + 1];
        }
        for (uint32_t i = 0; i < 64; ++i) {
            if (part * 64 + i >= valueCount) break;

            // don't mess with literals that have already been set
            if (state.visitedLiterals[part] & (1ull << i)) continue;
            
            if ((isPure0 & (1ull << i)) == 0) {
                setLiteral(state, part * 64 + i, false);
            }
            if ((isPure1 & (1ull << i)) != 0) {
                setLiteral(state, part * 64 + i, true);
            }
            /*
            state.visitedLiterals[part * 64 + i];
            state.literals[part * 64 + i] = !(isPure0 << i) || (isPure1 << i);*/
        }
    }
    delete[] discardedClauses;
}


bool solve(dpllState &state) {
    unitPropagate(state);
    pureLiteralAssign(state);

    if (state.discardedClausesCount == clauseCount) {
        memcpy(solution, state.literals, value64Count * sizeof(uint64_t));
        return true;
    }


    uint32_t literal = chooseLiteral(state);
    if (literal == -1) {
        return false;
    }

    // check setting literal to false
    dpllState newState = copyState(state);
    setLiteral(newState, literal, false);
    if (solve(newState)) {
        cleanupState(newState);
        return true;
    }
    
    // check setting literal to false
    copyState(state, newState);
    setLiteral(newState, literal, true);
    if (solve(newState)) {
        cleanupState(newState);
        return true;
    }
    cleanupState(newState);

    return false;
}



bool DPLL(std::vector<uint64_t*>& clauses, uint32_t _valueCount, uint64_t* _solution) {
    valueCount = _valueCount;
    value64Count = ((valueCount - 1) >> 6) + 1;

    clauseCount = clauses.size();

    solution = _solution;

    bool* discarded_clauses = new bool[clauseCount]();
    uint64_t* visited_literals = new uint64_t[value64Count]();
    uint64_t* literals = new uint64_t[value64Count]();

    pureLiteralClauseDiscardCache = new bool[clauseCount]();

    dpllState dpll = {
        0, &clauses, 0, discarded_clauses, visited_literals, literals
    };

    return solve(dpll);
}