{
    "targets": [{
        "target_name": "DPLL",
        "sources": [ "bindings.cpp", "DPLL.cpp" ],
        "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")",
            "."
        ],
        "configurations": {
            "Debug": {
                "defines": [ "NAPI_CPP_EXCEPTIONS" ],
                "conditions": [
                    ["OS=='linux'", {
                        "cflags": ["-fexceptions", "-Wall"],
                        "cflags_cc": ["-fexceptions", "-Wall"],
                    }],
                    ["OS=='windows'", {
                        'msvs_settings': {
                            'VCCLCompilerTool': {
                                'RuntimeLibrary': 2,
                                'ExceptionHandling': 1,
                                'AdditionalOptions': '/EHsc',
                            }
                        }
                    }]
                ]
            },
            "Release": {
                "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
                "ccflags": ["-fno-exceptions", "-Ofast", "-march=native"]
            },
            "coverage": {
                "defines": [ "NAPI_CPP_EXCEPTIONS" ],
                "cflags": ["-fexceptions", "-Wall", "-ftest-coverage", "--coverage"],
                "cflags_cc": ["-fexceptions", "-Wall", "-ftest-coverage", "--coverage"],
                "ldflags": ["-fprofile-arcs"],
            }
        }
    }]
} 