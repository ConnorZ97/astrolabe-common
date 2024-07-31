using System.Collections.Immutable;

namespace Astrolabe.Evaluator;

using EvaluatedExpr = EnvironmentValue<ValueExpr>;

public record EvalEnvironment(
    Func<DataPath, object?> GetDataFunc,
    Func<DataPath, bool>? ValidData,
    DataPath BasePath,
    ImmutableDictionary<string, EvalExpr> Variables
)
{
    public object? GetData(DataPath dataPath)
    {
        return ValidData == null || ValidData(dataPath) ? GetDataFunc(dataPath) : null;
    }

    public EvalExpr? GetVariable(string name)
    {
        return CollectionExtensions.GetValueOrDefault(Variables, name);
    }

    public EvalEnvironment WithVariable(string name, EvalExpr? value)
    {
        return this with
        {
            Variables = value == null ? Variables.Remove(name) : Variables.SetItem(name, value)
        };
    }

    public EvalEnvironment WithBasePath(DataPath basePath)
    {
        return this with { BasePath = basePath };
    }
}

public interface EnvironmentValue<out T>
{
    EvalEnvironment Env { get; }
    T Value { get; }

    EnvironmentValue<T2> Map<T2>(Func<T, EvalEnvironment, T2> select);

    EnvironmentValue<T2> Map<T2>(Func<T, T2> select);

    EnvironmentValue<T> EnvMap(Func<EvalEnvironment, EvalEnvironment> envFunc);
}

public record BasicEnvironmentValue<T>(EvalEnvironment Env, T Value) : EnvironmentValue<T>
{
    public ValueExpr AsValue()
    {
        return (ValueExpr)(object)Value!;
    }

    public EnvironmentValue<T2> Map<T2>(Func<T, EvalEnvironment, T2> select)
    {
        return Env.WithValue(select(Value, Env));
    }

    public EnvironmentValue<T2> Map<T2>(Func<T, T2> select)
    {
        return Env.WithValue(select(Value));
    }

    public EnvironmentValue<T> EnvMap(Func<EvalEnvironment, EvalEnvironment> envFunc)
    {
        return this with { Env = envFunc(Env) };
    }
}

public static class EvalEnvironmentExtensions
{
    public static void Deconstruct<T>(
        this EnvironmentValue<T> ev,
        out EvalEnvironment env,
        out T value
    )
    {
        env = ev.Env;
        value = ev.Value;
    }

    public static EnvironmentValue<IEnumerable<T>> Single<T>(this EnvironmentValue<T> ev)
    {
        return ev.Map<IEnumerable<T>>(x => [x]);
    }

    public static T2 Run<T, T2>(this EnvironmentValue<T> ev, Func<EnvironmentValue<T>, T2> select)
    {
        return select(ev);
    }

    public static EnvironmentValue<T> WithBasePath<T>(
        this EnvironmentValue<T> ev,
        DataPath basePath
    )
    {
        return ev.EnvMap(x => x.WithBasePath(basePath));
    }

    public static EvalEnvironment EvalForEach<T>(
        this EvalEnvironment env,
        IEnumerable<T> evalList,
        Func<EvalEnvironment, T, EvalEnvironment> evalFunc
    )
    {
        return evalList.Aggregate(env, evalFunc);
    }

    public static EnvironmentValue<IEnumerable<T>> SingleOrEmpty<T>(
        this EnvironmentValue<T?> evalResult
    )
    {
        return evalResult.Env.WithValue<IEnumerable<T>>(
            evalResult.Value != null ? [evalResult.Value] : []
        );
    }

    public static EnvironmentValue<IEnumerable<object?>> Singleton(this EvaluatedExpr evalExpr)
    {
        return evalExpr.Map<IEnumerable<object?>>(x => [x.Value]);
    }

    public static EvaluatedExpr IfElse(
        this EvaluatedExpr evalExpr,
        EvalExpr trueExpr,
        EvalExpr falseExpr
    )
    {
        return evalExpr.Value.IsNull()
            ? evalExpr
            : evalExpr.Env.Evaluate(evalExpr.Value.AsBool() ? trueExpr : falseExpr);
    }

    public static EnvironmentValue<IEnumerable<ValueExpr>> AppendTo(
        this EvaluatedExpr acc,
        EnvironmentValue<IEnumerable<ValueExpr>> other
    )
    {
        return acc.Env.WithValue(
            acc.Value != ValueExpr.Undefined ? other.Value.Append(acc.Value) : other.Value
        );
    }

    public static EnvironmentValue<IEnumerable<TResult>> EvalSelect<T, TResult>(
        this EvalEnvironment env,
        IEnumerable<T> evalList,
        Func<EvalEnvironment, T, EnvironmentValue<TResult>> evalFunc
    )
    {
        return evalList.Aggregate(
            env.WithEmpty<TResult>(),
            (allResults, r) =>
            {
                var result = evalFunc(allResults.Env, r);
                return result.Map(x => allResults.Value.Append(x));
            }
        );
    }

    public static EnvironmentValue<IEnumerable<TResult>> EvalConcat<T, TResult>(
        this EvalEnvironment env,
        IEnumerable<T> evalList,
        Func<EvalEnvironment, T, EnvironmentValue<IEnumerable<TResult>>> evalFunc
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

    public static EnvironmentValue<T> WithValue<T>(this EvalEnvironment env, T result)
    {
        return new BasicEnvironmentValue<T>(env, result);
    }

    public static EnvironmentValue<IEnumerable<T>> WithEmpty<T>(this EvalEnvironment env)
    {
        return env.WithValue<IEnumerable<T>>([]);
    }

    public static EvaluatedExpr WithNull(this EvalEnvironment env)
    {
        return env.WithValue(ValueExpr.Null);
    }

    public static EnvironmentValue<IEnumerable<T>> AppendTo<T>(
        this EnvironmentValue<IEnumerable<T>> envResult,
        EnvironmentValue<IEnumerable<T>> other
    )
    {
        return envResult.Map<IEnumerable<T>>(x => other.Value.Concat(x));
    }
}
