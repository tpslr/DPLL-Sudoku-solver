#include <condition_variable>
#include <thread>

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

struct SolveResult {
    uint32_t worker;
    bool result;
};

inline SolveResult solve2(dpllState *state, uint32_t literal, bool literalValue);
inline bool getResult(SolveResult &result);

class Worker {
    dpllState* state;
    std::condition_variable cv;
    std::condition_variable doneCv;
    bool result = false;
    bool done = false;
    bool killed = false;
    void main();
public:
    Worker();
    std::thread* thread;
    std::mutex mtx;
    std::mutex runningMtx;
    bool running = false;
    void run(dpllState *state);
    bool getResult();
    void kill();
};