export interface EmptyPath {
  segment: null;
}
export interface SegmentPath {
  segment: string | number;
  parent: Path;
}
export type Path = EmptyPath | SegmentPath;

export const EmptyPath: EmptyPath = { segment: null };

export function propertyExpr(property: string): PropertyExpr {
  return {
    type: "property",
    property,
  };
}

export function segmentPath(segment: string | number, parent?: Path) {
  return { segment, parent: parent ?? EmptyPath };
}
export type EvalExpr =
  | LetExpr
  | ArrayExpr
  | CallExpr
  | VarExpr
  | LambdaExpr
  | ValueExpr
  | FunctionExpr
  | BaseExpr
  | PropertyExpr;

export interface VarExpr {
  type: "var";
  variable: string;
}

export interface BaseExpr {
  type: "base";
  base: Path;
  expr: EvalExpr;
}

export interface LetExpr {
  type: "let";
  variables: [string, EvalExpr][];
  expr: EvalExpr;
}
export interface ArrayExpr {
  type: "array";
  values: EvalExpr[];
}

export interface CallExpr {
  type: "call";
  function: string;
  args: EvalExpr[];
}

export interface ValueExpr {
  type: "value";
  value: any;
  path?: Path;
}

export interface PropertyExpr {
  type: "property";
  property: string;
}

export interface LambdaExpr {
  type: "lambda";
  variable: string;
  expr: EvalExpr;
}

export interface FunctionExpr {
  type: "func";
  evaluate: (env: EvalEnv, args: CallExpr) => EnvValue<ValueExpr>;
}

export type EnvValue<T> = [EvalEnv, T];

export abstract class EvalEnv {
  abstract basePath: Path;
  abstract getVariable(name: string): EvalExpr;
  abstract getData(path: Path): unknown;
  abstract withVariables(vars: [string, EvalExpr][]): EvalEnv;
  abstract withVariable(name: string, expr: EvalExpr): EvalEnv;
  abstract withBasePath(path: Path): EvalEnv;
}

export function concatPath(path1: Path, path2: Path): Path {
  if (path2.segment == null) return path1;
  return { ...path2, parent: concatPath(path1, path2.parent!) };
}

export function varExpr(variable: string): VarExpr {
  return { type: "var", variable };
}

export type VarAssign = [string, EvalExpr];
export function letExpr(variables: VarAssign[], expr: EvalExpr): LetExpr {
  return { type: "let", variables, expr };
}

export function baseExpr(base: Path, expr: EvalExpr): BaseExpr {
  return { type: "base", expr, base };
}

export function valueExpr(value: any, path?: Path): ValueExpr {
  return { type: "value", value, path };
}

export function lambdaExpr(variable: string, expr: EvalExpr): LambdaExpr {
  return { type: "lambda", variable, expr };
}

export function arrayExpr(values: EvalExpr[]): ArrayExpr {
  return { type: "array", values };
}

export function callExpr(name: string, args: EvalExpr[]): CallExpr {
  return { type: "call", function: name, args };
}

export function mapExpr(left: EvalExpr, right: EvalExpr) {
  return callExpr(".", [left, right]);
}

export function evaluateElem(
  env: EvalEnv,
  value: ValueExpr,
  ind: number,
  expr: EvalExpr,
): EnvValue<ValueExpr> {
  switch (expr.type) {
    case "lambda":
      return evaluate(
        env.withVariables([
          [expr.variable, value],
          [expr.variable + "_index", { type: "value", value: ind }],
        ]),
        expr.expr,
      );
    default:
      if (!value.path) throw new Error("No path for element, must use lambda");
      return evaluate(env.withBasePath(value.path), expr);
  }
}

export function evaluate(env: EvalEnv, expr: EvalExpr): EnvValue<ValueExpr> {
  if (!env) debugger;
  switch (expr.type) {
    case "var":
      const varExpr = env.getVariable(expr.variable);
      return evaluate(env, varExpr);
    case "base":
      const oldBase = env.basePath;
      const [nextEnv, value] = evaluate(env.withBasePath(expr.base), expr.expr);
      return [nextEnv.withBasePath(oldBase), value];
    case "let":
      const withVars = env.withVariables(
        expr.variables.map((x) => [x[0], baseExpr(env.basePath, x[1])]),
      );
      return evaluate(withVars, expr.expr);
    case "value":
      return [env, expr];
    case "call":
      const funcCall = env.getVariable(expr.function);
      if (funcCall == null)
        throw new Error("Unknown function " + expr.function);
      return (funcCall as FunctionExpr).evaluate(env, expr);
    case "property":
      const actualPath = segmentPath(expr.property, env.basePath);
      let dataValue = env.getData(actualPath);
      if (Array.isArray(dataValue)) {
        dataValue = dataValue.map((x, i) =>
          valueExpr(x, segmentPath(i, actualPath)),
        );
      }
      return [env, { type: "value", value: dataValue, path: actualPath }];
    case "array":
      return mapEnv(mapAllEnv(env, expr.values, evaluate), (v) => ({
        value: v,
        type: "value",
      }));
    default:
      throw "Can't evaluate this:" + expr.type;
  }
}

export function mapEnv<T, T2>(
  envVal: EnvValue<T>,
  func: (v: T) => T2,
  envFunc?: (e: EvalEnv) => EvalEnv,
): EnvValue<T2> {
  const [e, v] = envVal;
  return [envFunc?.(e) ?? e, func(v)];
}

export function flatmapEnv<T, T2>(
  envVal: EnvValue<T>,
  func: (env: EvalEnv, v: T) => EnvValue<T2>,
): EnvValue<T2> {
  return func(envVal[0], envVal[1]);
}

export function withEnvValue<T, T2>(
  env: EnvValue<T>,
  func: (e: EvalEnv, t: T) => T2,
): T2 {
  return func(env[0], env[1]);
}

export function envEffect<T>(env: EnvValue<T>, func: (t: T) => any): EvalEnv {
  func(env[1]);
  return env[0];
}
export function mapAllEnv<T, T2>(
  env: EvalEnv,
  array: T[],
  func: (env: EvalEnv, value: T, ind: number) => EnvValue<T2>,
): EnvValue<T2[]> {
  const accArray: T2[] = [];
  const outEnv = array.reduce(
    (acc, x, ind) => envEffect(func(acc, x, ind), (nx) => accArray.push(nx)),
    env,
  );
  return [outEnv, accArray];
}

class BasicEvalEnv extends EvalEnv {
  constructor(
    private data: any,
    public basePath: Path,
    private vars: Record<string, EvalExpr>,
  ) {
    super();
  }

  getVariable(name: string): EvalExpr {
    return this.vars[name]!;
  }
  getData(path: Path): unknown {
    if (path.segment == null) return this.data;
    const parentObject = this.getData(path.parent);
    if (parentObject == null) return null;
    return typeof parentObject == "object"
      ? (parentObject as any)[path.segment]
      : null;
  }
  withVariables(vars: [string, EvalExpr][]): EvalEnv {
    return new BasicEvalEnv(
      this.data,
      this.basePath,
      Object.fromEntries(Object.entries(this.vars).concat(vars)),
    );
  }

  withVariable(name: string, expr: EvalExpr): EvalEnv {
    const outVars = { ...this.vars };
    outVars[name] = expr;
    return new BasicEvalEnv(this.data, this.basePath, outVars);
  }

  withBasePath(path: Path): EvalEnv {
    return new BasicEvalEnv(this.data, path, this.vars);
  }
}

export function basicEnv(data: any): EvalEnv {
  return new BasicEvalEnv(
    data,
    { segment: null },
    {
      "?": condFunction,
      "!": evalFunction((a) => !a[0]),
      and: binFunction((a, b) => a && b),
      or: binFunction((a, b) => a || b),
      "+": binFunction((a, b) => a + b),
      "-": binFunction((a, b) => a - b),
      "*": binFunction((a, b) => a * b),
      "/": binFunction((a, b) => a / b),
      ">": binFunction((a, b) => a > b),
      "<": binFunction((a, b) => a < b),
      "<=": binFunction((a, b) => a <= b),
      ">=": binFunction((a, b) => a >= b),
      "=": binFunction((a, b) => a == b),
      "!=": binFunction((a, b) => a != b),
      array: flatFunction,
      string: stringFunction,
      sum: aggFunction(0, (acc, b) => acc + (b as number)),
      count: aggFunction(0, (acc, b) => acc + 1),
      min: aggFunction(Number.MAX_VALUE, (a, b) => Math.min(a, b as number)),
      max: aggFunction(Number.MIN_VALUE, (a, b) => Math.max(a, b as number)),
      notEmpty: evalFunction(([a]) => !(a === "" || a == null)),
      which: whichFunction,
      ".": mapFunction,
      "[": filterFunction,
    },
  );
}

export const whichFunction: FunctionExpr = {
  type: "func",
  evaluate: (e, call) => {
    const [c, ...args] = call.args;
    let [env, cond] = evaluate(e, c);
    let i = 0;
    while (i < args.length - 1) {
      const compare = args[i++];
      const value = args[i++];
      const [nextEnv, compValue] = evaluate(env, compare);
      env = nextEnv;
      if (compValue.value == cond.value) return evaluate(nextEnv, value);
    }
    return [env, valueExpr(null)];
  },
};

export function binFunction(func: (a: any, b: any) => unknown): FunctionExpr {
  return {
    type: "func",
    evaluate: (env, call) => {
      const [nextEnv, [{ value: a }, { value: b }]] = mapAllEnv(
        env,
        call.args,
        evaluate,
      );
      if (a == null || b == null) return [nextEnv, valueExpr(null)];
      return [nextEnv, valueExpr(func(a, b))];
    },
  };
}

export function evalFunction(run: (args: unknown[]) => unknown): FunctionExpr {
  return {
    type: "func",
    evaluate: (e, call) =>
      mapEnv(mapAllEnv(e, call.args, evaluate), (a) =>
        valueExpr(run(a.map((x) => x.value))),
      ),
  };
}
function allElems(v: ValueExpr): ValueExpr[] {
  if (Array.isArray(v.value)) return v.value.flatMap(allElems);
  return [v];
}

const mapFunction: FunctionExpr = {
  type: "func",
  evaluate: (env: EvalEnv, call: CallExpr) => {
    const [left, right] = call.args;
    const [leftEnv, { value }] = evaluate(env, left);
    if (Array.isArray(value)) {
      return mapEnv(
        mapAllEnv(leftEnv, value, (e, elem: ValueExpr, i) =>
          evaluateElem(e, elem, i, right),
        ),
        (vals) => valueExpr(vals.flatMap(allElems)),
      );
    }
    console.error(value, left);
    throw new Error("Can't map this:");
  },
};

const filterFunction: FunctionExpr = {
  type: "func",
  evaluate: (env: EvalEnv, call: CallExpr) => {
    const [left, right] = call.args;
    const [leftEnv, { value, path }] = evaluate(env, left);
    if (Array.isArray(value)) {
      const accArray: ValueExpr[] = [];
      const outEnv = value.reduce(
        (e, x: ValueExpr, ind) =>
          envEffect(evaluateElem(e, x, ind, right), ({ value }) => {
            if ((typeof value === "number" && ind === value) || value === true)
              accArray.push(x);
          }),
        leftEnv,
      );
      return [outEnv, valueExpr(accArray)];
    }
    console.error(value, path);
    throw new Error("Can't filter this:");
  },
};

const condFunction: FunctionExpr = {
  type: "func",
  evaluate: (env: EvalEnv, call: CallExpr) => {
    return mapEnv(
      mapAllEnv(env, call.args, evaluate),
      ([{ value: c }, e1, e2]) =>
        c === true ? e1 : c === false ? e2 : valueExpr(null),
    );
  },
};

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [v];
}

function aggFunction<A>(init: A, op: (acc: A, x: unknown) => A): FunctionExpr {
  function performOp(v: ValueExpr[]): unknown {
    return v.reduce(
      (a, { value: b }) => (a != null && b != null ? op(a as A, b) : null),
      init as A | null,
    );
  }
  return {
    type: "func",
    evaluate: (e, call) => {
      const [ne, v] = mapAllEnv(e, call.args, evaluate);
      if (v.length == 1)
        return [ne, valueExpr(performOp(v[0].value as ValueExpr[]))];
      return [ne, valueExpr(performOp(v))];
    },
  };
}

function toString(v: unknown): string {
  switch (typeof v) {
    case "string":
      return v;
    case "boolean":
      return v ? "true" : "false";
    case "undefined":
      return "null";
    case "object":
      if (Array.isArray(v)) return v.map(toString).join("");
      if (v == null) return "null";
      return JSON.stringify(v);
    default:
      return (v as any).toString();
  }
}

const stringFunction: FunctionExpr = evalFunction(toString);

const flatFunction: FunctionExpr = {
  type: "func",
  evaluate: (e, call) => {
    const allArgs = mapAllEnv(e, call.args, evaluate);
    return mapEnv(allArgs, (x) => valueExpr(x.flatMap(allElems)));
  },
};

function toExpressions(expr: EvalExpr) {
  if (expr.type === "array") return flattenExpr(expr.values);
  return [expr];
}
function flattenExpr(expressions: EvalExpr[]): EvalExpr[] {
  return expressions.flatMap(toExpressions);
}

export function toNative(value: ValueExpr): unknown {
  if (Array.isArray(value.value)) {
    return value.value.map(toNative);
  }
  return value.value;
}
