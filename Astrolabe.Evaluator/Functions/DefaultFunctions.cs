using System.Collections.Immutable;

namespace Astrolabe.Evaluator.Functions;

public static class DefaultFunctions
{
    public static string ExprValueToString(object? value)
    {
        return value switch
        {
            null => "",
            ArrayValue av => string.Join("", av.Values.Select(ExprValueToString)),
            ObjectValue => "{}",
            _ => value.ToString() ?? ""
        };
    }

    public static FunctionHandler UnaryNullOp(Func<object, object?> evaluate)
    {
        return FunctionHandler.DefaultEval(
            (args) =>
                args switch
                {
                    [{ } v1] => evaluate(v1),
                    [_] => null,
                    _ => throw new ArgumentException("Wrong number of args:" + args)
                }
        );
    }

    public static FunctionHandler BinOp(Func<object?, object?, object?> evaluate)
    {
        return FunctionHandler.DefaultEval(
            (args) =>
                args switch
                {
                    [var v1, var v2] => evaluate(v1, v2),
                    _ => throw new ArgumentException("Wrong number of args:" + args)
                }
        );
    }

    public static FunctionHandler BinNullOp(Func<object, object, object?> evaluate)
    {
        return FunctionHandler.DefaultEval(
            (args) =>
                args switch
                {
                    [{ } v1, { } v2] => evaluate(v1, v2),
                    [_, _] => null,
                    _ => throw new ArgumentException("Wrong number of args:" + args)
                }
        );
    }

    public static FunctionHandler BoolOp(Func<bool, bool, bool> func)
    {
        return BinNullOp(
            (a, b) =>
                (a, b) switch
                {
                    (bool b1, bool b2) => func(b1, b2),
                    _ => throw new ArgumentException("Bad args for bool op")
                }
        );
    }

    public static FunctionHandler NumberOp<TOutD, TOutL>(
        Func<double, double, TOutD> doubleOp,
        Func<long, long, TOutL> longOp
    )
    {
        return BinNullOp(
            (o1, o2) =>
            {
                if (ValueExpr.MaybeInteger(o1) is { } l1 && ValueExpr.MaybeInteger(o2) is { } l2)
                {
                    return longOp(l1, l2);
                }
                return doubleOp(ValueExpr.AsDouble(o1), ValueExpr.AsDouble(o2));
            }
        );
    }

    public static FunctionHandler EqualityFunc(bool not)
    {
        return BinNullOp((v1, v2) => not ^ Equals(AsEqualityCheck(v1), AsEqualityCheck(v2)));
    }

    public static object AsEqualityCheck(this object? v)
    {
        return v switch
        {
            int i => (double)i,
            long l => (double)l,
            not null => v,
            _ => throw new ArgumentException("Cannot be compared: " + v)
        };
    }

    private static readonly FunctionHandler AddNumberOp = NumberOp<double, long>(
        (d1, d2) => d1 + d2,
        (l1, l2) => l1 + l2
    );

    private static readonly FunctionHandler IfElseOp = FunctionHandler.DefaultEval(
        (args) =>
            args switch
            {
                [bool b, var thenVal, var elseVal] => b ? thenVal : elseVal,
                [null, _, _] => null,
                _ => throw new ArgumentException("Bad conditional: " + args),
            }
    );

    private static readonly FunctionHandler StringOp = FunctionHandler.DefaultEval(
        ExprValueToString
    );

    public static FunctionHandler ArrayOp<T>(T init, Func<T, object?, T> arrayFunc)
    {
        return FunctionHandler.DefaultEval(args =>
            args switch
            {
                [ArrayValue av] => av.Values.Aggregate((T?)init, (acc, v) => RunOp(acc, v.Value)),
                _ => args.Aggregate((T?)init, RunOp)
            }
        );

        T? RunOp(T? acc, object? o)
        {
            if (acc is null || o == null)
            {
                return default;
            }
            return arrayFunc(acc, o);
        }
    }

    public static readonly Dictionary<string, FunctionHandler> FunctionHandlers =
        new()
        {
            { "+", AddNumberOp },
            { "-", NumberOp<double, long>((d1, d2) => d1 - d2, (l1, l2) => l1 - l2) },
            { "*", NumberOp<double, long>((d1, d2) => d1 * d2, (l1, l2) => l1 * l2) },
            { "/", NumberOp<double, double>((d1, d2) => d1 / d2, (l1, l2) => (double)l1 / l2) },
            { "=", EqualityFunc(false) },
            { "!=", EqualityFunc(true) },
            { "<", NumberOp((d1, d2) => d1 < d2, (l1, l2) => l1 < l2) },
            { "<=", NumberOp((d1, d2) => d1 <= d2, (l1, l2) => l1 <= l2) },
            { ">", NumberOp((d1, d2) => d1 > d2, (l1, l2) => l1 > l2) },
            { ">=", NumberOp((d1, d2) => d1 >= d2, (l1, l2) => l1 >= l2) },
            { "and", BoolOp((a, b) => a && b) },
            { "or", BoolOp((a, b) => a || b) },
            { "!", UnaryNullOp((a) => a is bool b ? !b : null) },
            { "?", IfElseOp },
            { "sum", ArrayOp(0d, (acc, v) => acc + ValueExpr.AsDouble(v)) },
            { "min", ArrayOp(double.MaxValue, (acc, v) => Math.Min(acc, ValueExpr.AsDouble(v))) },
            { "max", ArrayOp(double.MinValue, (acc, v) => Math.Max(acc, ValueExpr.AsDouble(v))) },
            { "count", ArrayOp(0, (acc, v) => acc + 1) },
            {
                "array",
                FunctionHandler.DefaultEval(args => new ArrayValue(
                    args.SelectMany(x => new ValueExpr(x).AllValues())
                ))
            },
            {
                "notEmpty",
                FunctionHandler.DefaultEval(x =>
                    x[0] switch
                    {
                        string s => !string.IsNullOrWhiteSpace(s),
                        null => false,
                        _ => true
                    }
                )
            },
            { "string", StringOp },
            // {
            //     "which",
            //     FunctionHandler.ResolveOnly(
            //         (e, call) =>
            //         {
            //             return e.ResolveExpr(
            //                 call.Args.Aggregate(
            //                     new WhichState(ValueExpr.Null, null, null),
            //                     (s, x) => s.Next(x)
            //                 ).Current
            //             );
            //         }
            //     )
            // },
            { "[", FilterFunctionHandler.Instance },
            { ".", MapFunctionHandler.Instance },
        };

    public static EvalEnvironment AddDefaultFunctions(this EvalEnvironment eval)
    {
        return eval.WithVariables(
            FunctionHandlers
                .Select(x => new KeyValuePair<string, EvalExpr>(x.Key, new ValueExpr(x.Value)))
                .ToList()
        );
    }

    record WhichState(EvalExpr Current, EvalExpr? Compare, EvalExpr? ToExpr)
    {
        public WhichState Next(EvalExpr expr)
        {
            if (Compare is null)
                return this with { Compare = expr };
            if (ToExpr is null)
                return this with { ToExpr = expr };
            return this with
            {
                Current = new CallExpr("?", [new CallExpr("=", [Compare, ToExpr]), expr, Current]),
                ToExpr = null
            };
        }
    }

    public static object CreateEnvironment(Func<DataPath, object?> fromObject)
    {
        throw new NotImplementedException();
    }
}
