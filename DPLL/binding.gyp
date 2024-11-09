{
  "targets": [
    {
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "."
      ],
      "target_name": "DPLL",
      "sources": [ "bindings.cpp", "DPLL.cpp" ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ],
      'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 2,
            'ExceptionHandling': 1,
            '/EHsc': ""
          }
      }
    }
  ],
} 