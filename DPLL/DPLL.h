
struct dpllState {
    uint32_t lastLiteral;
    std::vector<uint64_t*> *clauses;
    uint32_t discardedClausesCount;
    bool *discardedClauses;
    uint64_t *visitedLiterals;
    uint64_t *literals;
};

bool DPLL(std::vector<uint64_t*>& clauses, uint32_t _valueCount, uint64_t* solution);

bool solve(dpllState &state);