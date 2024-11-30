#include <napi.h>
#include <./DPLL.h>


static Napi::Value Entrypoint(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();


    Napi::Array buffers = info[1].As<Napi::Array>();

    uint32_t len = buffers.Length();

    std::vector<uint64_t*> clauses;
    
    for (uint32_t i = 0; i < len; ++i) {
        clauses.emplace_back(buffers.Get(i).As<Napi::Buffer<uint64_t>>().Data());
    }

    uint32_t valueCount = info[0].As<Napi::Number>().Int32Value();
    uint32_t value64Count = ((valueCount - 1) >> 6) + 1;

    uint64_t* solution = new uint64_t[value64Count](); 
    
    if (DPLL(clauses, valueCount, solution)) {
        return Napi::Buffer<uint64_t>::New(env, solution, value64Count);
    }
    return Napi::String::New(env, "UNSATISFIABLE");
}

#define DECLARE_NAPI_METHOD(name, func)  { name, 0, func, 0, 0, 0, napi_default, 0 }

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "solve"), Napi::Function::New(env, Entrypoint));
    return exports;
}

NODE_API_MODULE(NAPI_MODULE_NAME, Init)