/**
 * Shared by this directory's plain-Node tests: extracts a Vue SFC's <script>
 * block and transpiles it with the TypeScript compiler that is already a
 * devDependency (no new packages), so `Vue.extend({...})`'s options object can
 * be exercised directly -- no DOM, no test runner, since this project has
 * neither and adding one is out of scope for these fixes.
 *
 * See checker-navigation.test.js for the fuller rationale.
 */

const fs = require("fs");
const vm = require("vm");
const ts = require("typescript");

function extractScriptBlock(source) {
  const match = source.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("Could not find a <script> block in the given file");
  }
  return match[1];
}

/**
 * @param {string} filePath absolute path to a .vue SFC
 * @param {(specifier: string) => any} [resolveImport] extra import stubs;
 *   called for any import this loader doesn't already know about
 * @param {object} [extraGlobals] extra bindings for the sandbox's global
 *   scope (e.g. `document`, `window`, `URL`) -- component methods are
 *   defined inside this vm context, so free variables they close over
 *   resolve from here, not from whatever scope later calls `.call(self)`
 */
function loadComponentOptions(filePath, resolveImport, extraGlobals) {
  const source = fs.readFileSync(filePath, "utf8");
  const scriptSource = extractScriptBlock(source);
  const transpiled = ts.transpileModule(scriptSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  }).outputText;

  // `.extend()` is always the identity function here: whether the SFC extends
  // `Vue` directly or extends a mixin (itself `Vue.extend({...})`), the result
  // ends up as `exports.default`, so it's read back from there rather than
  // from a side channel -- one mock shape covers every extend-chain depth.
  //
  // No `__esModule` flag: `import Vue from "vue"` compiles (with
  // esModuleInterop) to `__importDefault(require("vue"))`, which only wraps a
  // plain CommonJS export into `{ default: ... }` when it ISN'T already
  // flagged as an ES module -- exactly the wrapping a real `require("vue")`
  // gets, so `vue_1.default.extend` resolves the same way here.
  const identityExtend = { extend: (options) => options };

  const sandboxModule = { exports: {} };
  const sandboxRequire = (specifier) => {
    if (specifier === "vue") {
      return identityExtend;
    }
    if (resolveImport) {
      const resolved = resolveImport(specifier, identityExtend);
      if (resolved !== undefined) {
        return resolved;
      }
    }
    throw new Error(`Unexpected import in test sandbox: ${specifier}`);
  };

  const context = vm.createContext({
    require: sandboxRequire,
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
    ...extraGlobals,
  });
  vm.runInContext(transpiled, context, { filename: "component.transpiled.js" });

  const captured = sandboxModule.exports.default;
  if (!captured) {
    throw new Error("The component's default export was never set -- options not captured");
  }
  return captured;
}

/**
 * Loads a plain `.ts` module the same way, for helpers that are not SFCs.
 *
 * Returns the module's whole exports object rather than `default`, since a
 * helper module's value is its named exports.
 */
function loadModule(filePath, resolveImport, extraGlobals) {
  const transpiled = ts.transpileModule(fs.readFileSync(filePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  }).outputText;

  const sandboxModule = { exports: {} };
  const sandboxRequire = (specifier) => {
    if (resolveImport) {
      const resolved = resolveImport(specifier);
      if (resolved !== undefined) {
        return resolved;
      }
    }
    throw new Error(`Unexpected import in test sandbox: ${specifier}`);
  };

  const context = vm.createContext({
    require: sandboxRequire,
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
    ...extraGlobals,
  });
  vm.runInContext(transpiled, context, { filename: "module.transpiled.js" });
  return sandboxModule.exports;
}

module.exports = { loadComponentOptions, loadModule };
