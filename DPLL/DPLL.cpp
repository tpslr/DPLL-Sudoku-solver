#include <stdlib.h>
#include <cstdint>
#include <vector>
#include <./DPLL.h>
#include <string.h>

uint32_t clauseCount;
uint32_t valueCount;
uint32_t value64Count;

uint64_t* solution;



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
    bool* discarded_clauses = new bool[clauseCount];
    uint64_t* visited_literals = new uint64_t[value64Count];
    uint64_t* literals = new uint64_t[value64Count];

    memcpy(discarded_clauses, state.discardedClauses, clauseCount);
    memcpy(visited_literals, state.visitedLiterals, value64Count * sizeof(uint64_t));
    memcpy(literals, state.literals, value64Count * sizeof(uint64_t));

    return {
        state.lastLiteral, state.clauses, state.discardedClausesCount, discarded_clauses, visited_literals, literals
    };
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

}

inline void pureLiteralAssign(dpllState &state) {
    // discarded clauses needs to be copied since it can change due to setLiteral
    // current state is needed since everything looped over in chunks
    bool *discardedClauses = new bool[clauseCount];
    memcpy(discardedClauses, state.discardedClauses, clauseCount);

    for (uint32_t part = 0; part < value64Count; ++part) {
        uint64_t isPure0 = 0;
        uint64_t isPure1 = (uint64_t)-1;

        for (uint32_t i = 0; i < clauseCount; ++i) {
            if (discardedClauses[i]) continue;
            uint64_t* clause = state.clauses->at(i);
            isPure0 |= clause[part];
            isPure1 &= clause[part];
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
    //unitPropagate(state);
    //pureLiteralAssign(state);

    if (state.discardedClausesCount == clauseCount) {
        memcpy(solution, state.literals, value64Count * sizeof(uint64_t));
        return true;
    }


    uint32_t literal = chooseLiteral(state);
    if (literal == -1) {
        return false;
    }

    // check setting literal to false
    dpllState falseState = copyState(state);
    setLiteral(falseState, literal, false);
    if (solve(falseState)) {
        cleanupState(falseState);
        return true;
    }
    cleanupState(falseState);
    
    // check setting literal to false
    dpllState trueState = copyState(state);
    setLiteral(trueState, literal, true);
    if (solve(trueState)) {
        cleanupState(trueState);
        return true;
    }
    cleanupState(trueState);

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

    dpllState dpll = {
        0, &clauses, 0, discarded_clauses, visited_literals, literals
    };

    return solve(dpll);
}