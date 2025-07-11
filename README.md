# Clava MISRA Tool

A Clava-based library to automatically detect and correct parts of C code that violate MISRA-C:2012 coding standard.

For more details, see the [Clava Transpiler repository](https://github.com/specs-feup/clava).

## Installation

To get started, ensure the tool's NPM package is installed in your project:

```bash
npm install @specs-feup/clava-misra
```

## Usage

### 1. Analysis
You can use the tool to simply check the violations by executing the following statements in your script:

```ts
import MISRATool from "@specs-feup/clava-misra/dist/MISRATool.js";

MISRATool.checkCompliance();
```
After analysis, each identified violation will be displayed, including its location and description.

### 2. Correction
Besides analysis, the tool can also correct the provided source code to comply with the coding guidelines, using the following statements:

```ts
import MISRATool from "@specs-feup/clava-misra/dist/MISRATool.js";

MISRATool.applyCorrections();
```

After the transformation, any violations that could not be fixed will be displayed along with their justification. The corrected files will be saved in the `woven_code` folder.

You can provide an **optional** JSON config file to assist in correcting specific rules, such as implicit function calls, disallowed functions, and missing return statements. For instance, you can:
-  Define default values for certain types to address functions with missing return statements.
- Specify the path or library for implicit function calls.
- Provide custom implementations for disallowed functions.

The config file should follow this structure:
```json
{
  "defaultValues": {
    "unsigned int": 0,  
    "float": 0.0,
    "enum Status": "SUCCESS",
    "Color": "RED",
    "my_int_type": "0"
  }, 
  "implicitCalls": {
    "printf": "stdio.h",
    "foo": "CxxSources/utils/functions.c"
  },
  "disallowedFunctions": {
    "stdlib.h": {
      "malloc": {
        "replacement": "custom_malloc",
        "location": "utils/custom_stdlib.c"
      },
      "exit": {
        "replacement": "custom_exit",
        "location": "utils/custom_stdlib.c"
      }
    }
  }
}
```
**Note:** Not all fields (`defaultValues`, `implicitCalls`, `disallowedFunctions`) are required and if the config file is not provided or lacks the necessary information to fix a violation, the violation will remain and be displayed as unresolved. 


## Execution

To execute a project that uses this tool, provide the following information:

- The path to your **script file**. 
- The **C standard** to use (`c90`, `c99`, or `c11`).
- The path to the **source code** to process.
- *(Optional)* The **analysis type** (`system`, `single`, or `all`).
- *(Optional)* The full path to a **config file**.
```bash
npx clava classic <scriptFile.js> -pi -std <c90 | c99 | c11> -p <path/to/source/code> [-av <path/to/config.json>]
```

### Examples:

Default use without a config file and analysis type (default is `all`)

```bash
npx clava classic src/main.js -pi -std c99 -p CxxSources/
```

With analysis type specified:
```bash
npx clava classic src/main.js -pi -std c99 -p CxxSources/ -av "type=system"
```

Using a config file:
```bash
npx clava classic src/main.js -pi -std c99 -p CxxSources/ -av "config=misra_config.json"
```

With both analysis and config file specified:
```bash
npx clava classic src/main.js -pi -std c99 -p CxxSources/ -av "type=system config=misra_config.json"
```

To view other available options, run:

```bash
npx clava classic --help
```