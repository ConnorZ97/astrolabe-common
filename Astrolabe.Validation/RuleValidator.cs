using System.Collections;
using System.Collections.Immutable;
using System.Text.Json.Nodes;
using System.Transactions;
using Astrolabe.Evaluator;
using Astrolabe.Evaluator.Functions;

namespace Astrolabe.Validation;

public record ValidatorState(
    IEnumerable<Failure> Failures,
    ValueExpr Message,
    ImmutableHashSet<DataPath> DependentData,
    IEnumerable<EvaluatedRule> Rules,
    ImmutableDictionary<string, object?> Properties
)
{
    public static readonly ValidatorState Empty =
        new(
            [],
            ValueExpr.Null,
            ImmutableHashSet<DataPath>.Empty,
            [],
            ImmutableDictionary<string, object?>.Empty
        );
}

public class ValidatorEvalEnvironment(EvalEnvironmentState state, ValidatorState validatorState)
    : EvalEnvironment(state)
{
    protected override EvalEnvironment NewEnv(EvalEnvironmentState newState)
    {
        return new ValidatorEvalEnvironment(newState, validatorState);
    }

    public ValidatorState ValidatorState => validatorState;

    public EvalEnvironment WithValidatorState(ValidatorState newState)
    {
        return new ValidatorEvalEnvironment(state, newState);
    }

    public override EnvironmentValue<ValueExpr> Evaluate(EvalExpr evalExpr)
    {
        return evalExpr switch
        {
            ValueExpr { Path: { } p } vp
                => WithValidatorState(
                        validatorState with
                        {
                            DependentData = validatorState.DependentData.Add(p)
                        }
                    )
                    .WithValue(vp),
            _ => base.Evaluate(evalExpr)
        };
    }
}

public static class RuleValidator
{
    public const string RuleFunction = "ValidatorRule";

    public static ValidatorState GetValidatorState(this EvalEnvironment env)
    {
        return ((ValidatorEvalEnvironment)env).ValidatorState;
    }

    public static EvalEnvironment UpdateValidatorState(
        this EvalEnvironment env,
        Func<ValidatorState, ValidatorState> update
    )
    {
        return ((ValidatorEvalEnvironment)env).WithValidatorState(update(env.GetValidatorState()));
    }

    public static EvalEnvironment FromData(Func<DataPath, ValueExpr> data)
    {
        return new ValidatorEvalEnvironment(
            EvalEnvironmentState.EmptyState(data),
            ValidatorState.Empty
        ).WithVariables(
            ImmutableDictionary<string, EvalExpr>
                .Empty.AddRange(DefaultFunctions.FunctionHandlers.Select(ToVariable))
                .Add(RuleFunction, new ValueExpr(new FunctionHandler(EvaluateValidation)))
                .Add("WithMessage", new ValueExpr(new FunctionHandler(EvalWithMessage)))
                .Add("WithProperty", new ValueExpr(new FunctionHandler(EvalWithProperty)))
        );
    }

    private static KeyValuePair<string, EvalExpr> ToVariable(
        KeyValuePair<string, FunctionHandler> func
    )
    {
        var funcValue = func.Key switch
        {
            "=" or "!=" or ">" or "<" or ">=" or "<=" or "notEmpty" => WrapFunc(func.Value),
            _ => func.Value
        };
        return new KeyValuePair<string, EvalExpr>(func.Key, new ValueExpr(funcValue));

        FunctionHandler WrapFunc(FunctionHandler handler)
        {
            return handler with
            {
                Evaluate = (e, call) =>
                {
                    var (env, args) = e.EvalSelect(call.Args, (e2, x) => e2.Evaluate(x));
                    var argValuesValue = args.ToList();
                    var result = handler.Evaluate(env, call.WithArgs(argValuesValue));
                    var resultValue = result.Value;
                    if (resultValue.IsFalse())
                    {
                        return result
                            .Env.UpdateValidatorState(v =>
                                v with
                                {
                                    Failures = v.Failures.Append(new Failure(call, argValuesValue))
                                }
                            )
                            .WithValue(resultValue);
                    }
                    return result;
                }
            };
        }
    }

    private static EnvironmentValue<ValueExpr> EvalWithProperty(
        EvalEnvironment environment,
        CallExpr callExpr
    )
    {
        var (evalEnvironment, args) = environment.EvalSelect(
            callExpr.Args.Take(2),
            (e, x) => e.Evaluate(x)
        );
        var argList = args.ToList();
        return evalEnvironment
            .UpdateValidatorState(valEnv =>
                valEnv with
                {
                    Properties = valEnv.Properties.SetItem(argList[0].AsString(), argList[1].Value)
                }
            )
            .Evaluate(callExpr.Args[2]);
    }

    public static EnvironmentValue<ValueExpr> EvalWithMessage(
        EvalEnvironment environment,
        CallExpr callExpr
    )
    {
        var (msgEnv, msg) = environment.Evaluate(callExpr.Args[0]);
        return msgEnv
            .UpdateValidatorState(v => v with { Message = msg })
            .Evaluate(callExpr.Args[1]);
    }

    public static EnvironmentValue<ValueExpr> EvaluateValidation(
        EvalEnvironment environment,
        CallExpr callExpr
    )
    {
        var results = environment
            .UpdateValidatorState(
                (x) =>
                    x with
                    {
                        Failures = [],
                        Message = ValueExpr.Null,
                        DependentData = ImmutableHashSet<DataPath>.Empty,
                        Properties = ImmutableDictionary<string, object?>.Empty
                    }
            )
            .EvalSelect(callExpr.Args, (e, x) => e.Evaluate(x));
        var argValues = results.Value.ToList();
        return results
            .Env.UpdateValidatorState(x =>
                x with
                {
                    Rules = x.Rules.Append(
                        new EvaluatedRule(
                            argValues[0],
                            argValues[1],
                            x.Failures,
                            x.Message.AsString(),
                            x.DependentData,
                            x.Properties
                        )
                    )
                }
            )
            .WithValue(argValues[0]);
    }

    public static List<EvaluatedRule> ValidateJson(JsonNode data, Rule rule, LetExpr? variables)
    {
        var baseEnv = FromData(JsonDataLookup.FromObject(data));
        return ValidateRules(baseEnv, rule, variables);
    }

    public static List<EvaluatedRule> ValidateRules(
        EvalEnvironment baseEnv,
        Rule rule,
        LetExpr? variables
    )
    {
        var ruleEnv = variables != null ? baseEnv.Evaluate(variables).Env : baseEnv;
        var ruleList = ruleEnv.EvaluateRule(rule);
        return ruleList.Value.ToList();
        // var byPath = allRules.ToLookup(x => x.Path);
        // var dataOrder = allRules.GetDataOrder();
        // var validationResult = ruleEnv.EvalConcat(
        //     dataOrder,
        //     (de, p) =>
        //         de.EvalConcat(
        //             adjustRules(p, byPath[p]),
        //             (e, r) => e.EvaluateFailures(r).SingleOrEmpty()
        //         )
        // );
        // return validationResult;
    }

    // public static EnvironmentValue<RuleFailure?> EvaluateFailures(
    //     this EvalEnvironment environment,
    //     ResolvedRule rule
    // )
    // {
    //     var (outEnv, result) = environment.Evaluate(rule.Must);
    //     RuleFailure? failure = null;
    //     var valEnv = outEnv.GetValidatorState();
    //     if (result.IsFalse())
    //     {
    //         failure = new RuleFailure(valEnv.Failures, valEnv.Message.AsString(), rule);
    //     }
    //
    //     var failedData = result.IsFalse() ? valEnv.FailedData.Add(rule.Path) : valEnv.FailedData;
    //     var resetEnv = valEnv with
    //     {
    //         Properties = ImmutableDictionary<string, object?>.Empty,
    //         Message = ValueExpr.Null,
    //         Failures = [],
    //         FailedData = failedData
    //     };
    //     return (
    //         outEnv.UpdateValidatorState(_ => resetEnv) with
    //         {
    //             ValidData = dp => !failedData.Contains(dp)
    //         }
    //     ).WithValue(failure);
    // }

    public static EnvironmentValue<IEnumerable<EvaluatedRule>> EvaluateRule(
        this EvalEnvironment environment,
        Rule rule
    )
    {
        return environment.Evaluate(ToExpr(rule)).Map((v, e) => e.GetValidatorState().Rules);
    }

    private static EvalExpr ToExpr(Rule rule)
    {
        return rule switch
        {
            ForEachRule rulesForEach => DoRulesForEach(rulesForEach),
            SingleRule pathRule => DoPathRule(pathRule),
            MultiRule multi => DoMultiRule(multi)
        };

        EvalExpr DoMultiRule(MultiRule multiRule)
        {
            return new ArrayExpr(multiRule.Rules.Select(ToExpr));
        }

        EvalExpr DoPathRule(SingleRule pathRule)
        {
            return new CallExpr(RuleFunction, [pathRule.Path, pathRule.Must, pathRule.Props]);
        }

        EvalExpr DoRulesForEach(ForEachRule rules)
        {
            var ruleExpr = ToExpr(rules.Rule);
            if (rules.Variables != null)
                ruleExpr = rules.Variables with { In = ruleExpr };
            return CallExpr.Map(rules.Path, new LambdaExpr(rules.Index.Name, ruleExpr));
        }
    }
}

public record Failure(CallExpr Call, IList<ValueExpr> EvaluatedArgs);

public record EvaluatedRule(
    ValueExpr Path,
    ValueExpr Result,
    IEnumerable<Failure> Failures,
    string? Message,
    ImmutableHashSet<DataPath> DependentData,
    IDictionary<string, object?> Properties
);
