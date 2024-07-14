using System.Collections;
using System.Collections.Immutable;
using System.Text.Json.Nodes;

namespace Astrolabe.Validation;

using EvaluatedExpr = EvaluatedResult<ExprValue>;

public record EvalEnvironment(
    Func<DataPath, object?> GetData,
    IEnumerable<Failure> Failures,
    ExprValue Message,
    ImmutableHashSet<DataPath> FailedData,
    ImmutableDictionary<string, object?> Properties,
    ImmutableDictionary<Expr, ExprValue> Replacements
)
{
    public EvalEnvironment AddFailureIf(
        bool? result,
        InbuiltFunction function,
        ExprValue actual,
        ExprValue expected
    )
    {
        if (result == false)
        {
            return this with
            {
                Failures = Failures.Append(new Failure(function, actual, expected))
            };
        }
        return this;
    }

    public EvalEnvironment WithProperty(string key, object? value)
    {
        return this with { Properties = Properties.SetItem(key, value) };
    }

    public EvalEnvironment WithReplacement(Expr expr, ExprValue value)
    {
        var _ = expr switch
        {
            VarExpr ve => true,
            _ => throw new ArgumentException("Can't replace that")
        };
        return this with { Replacements = Replacements.SetItem(expr, value) };
    }

    public EvalEnvironment WithMessage(ExprValue message)
    {
        return this with { Message = message };
    }

    public static EvalEnvironment FromData(Func<DataPath, object?> data)
    {
        return new EvalEnvironment(
            data,
            [],
            ExprValue.Null,
            ImmutableHashSet<DataPath>.Empty,
            ImmutableDictionary<string, object?>.Empty,
            ImmutableDictionary<Expr, ExprValue>.Empty
        );
    }

    public EvalEnvironment WithFailedPath(DataPath rulePath)
    {
        return this with { FailedData = FailedData.Add(rulePath) };
    }
}

public record Failure(InbuiltFunction Function, ExprValue Actual, ExprValue Expected);

public record RuleFailure(IEnumerable<Failure> Failures, string? Message, ResolvedRule Rule);

public record EvaluatedResult<T>(EvalEnvironment Env, T Result)
{
    public ExprValue AsValue()
    {
        return (ExprValue)(object)Result!;
    }

    public EvaluatedResult<T2> Map<T2>(Func<T, EvalEnvironment, T2> select)
    {
        return Env.WithResult(select(Result, Env));
    }

    public EvaluatedResult<T2> Map<T2>(Func<T, T2> select)
    {
        return Env.WithResult(select(Result));
    }

    public EvaluatedResult<IEnumerable<T>> Single()
    {
        return Env.WithResult<IEnumerable<T>>([Result]);
    }
}

public static class EvalEnvironmentExtensions
{
    public static EvaluatedResult<IEnumerable<T>> SingleOrEmpty<T>(
        this EvaluatedResult<T?> evalResult
    )
    {
        return evalResult.Env.WithResult<IEnumerable<T>>(
            evalResult.Result != null ? [evalResult.Result] : []
        );
    }

    public static EvaluatedResult<T> WithReplacement<T>(
        this EvaluatedResult<T> evalExpr,
        Expr expr,
        ExprValue value
    )
    {
        return evalExpr with { Env = evalExpr.Env.WithReplacement(expr, value) };
    }

    public static EvaluatedResult<IEnumerable<object?>> Singleton(this EvaluatedExpr evalExpr)
    {
        return evalExpr.Map<IEnumerable<object?>>(x => [x.Value]);
    }

    public static EvaluatedExpr IfElse(this EvaluatedExpr evalExpr, Expr trueExpr, Expr falseExpr)
    {
        return evalExpr.Result.IsNull()
            ? evalExpr
            : evalExpr.Env.Evaluate(evalExpr.Result.AsBool() ? trueExpr : falseExpr);
    }

    public static EvaluatedResult<IEnumerable<ExprValue>> AppendTo(
        this EvaluatedExpr acc,
        EvaluatedResult<IEnumerable<ExprValue>> other
    )
    {
        return acc.Env.WithResult(other.Result.Append(acc.Result));
    }

    public static EvaluatedResult<IEnumerable<TResult>> EvaluateAll<T, TResult>(
        this EvalEnvironment env,
        IEnumerable<T> evalList,
        Func<EvalEnvironment, T, EvaluatedResult<IEnumerable<TResult>>> evalFunc
    )
    {
        return evalList.Aggregate(
            env.WithEmpty<TResult>(),
            (allResults, r) =>
            {
                var result = evalFunc(allResults.Env, r);
                return result.AppendTo(allResults);
            }
        );
    }

    public static EvaluatedResult<T> WithResult<T>(this EvalEnvironment env, T result)
    {
        return new EvaluatedResult<T>(env, result);
    }

    public static EvaluatedResult<IEnumerable<T>> WithEmpty<T>(this EvalEnvironment env)
    {
        return new EvaluatedResult<IEnumerable<T>>(env, []);
    }

    public static EvaluatedExpr WithExprValue(this EvalEnvironment env, ExprValue value)
    {
        return new EvaluatedExpr(env, value);
    }

    public static EvaluatedResult<Expr> WithExpr(this EvalEnvironment env, Expr value)
    {
        return new EvaluatedResult<Expr>(env, value);
    }

    public static EvaluatedExpr WithNull(this EvalEnvironment env)
    {
        return new EvaluatedExpr(env, ExprValue.Null);
    }

    public static EvaluatedResult<IEnumerable<T>> AppendTo<T>(
        this EvaluatedResult<IEnumerable<T>> envResult,
        EvaluatedResult<IEnumerable<T>> other
    )
    {
        return envResult with { Result = other.Result.Concat(envResult.Result) };
    }
}
