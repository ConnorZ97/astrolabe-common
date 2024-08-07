using System.Collections.Immutable;
using Astrolabe.Evaluator;

namespace Astrolabe.Validation;

public static class RuleEvaluation
{
    public static EnvironmentValue<RuleFailure?> EvaluateFailures(
        this EvalEnvironment environment,
        ResolvedRule rule
    )
    {
        var (outEnv, result) = environment.Evaluate(rule.Must);
        RuleFailure? failure = null;
        var valEnv = outEnv.GetValidatorState();
        if (result.IsFalse())
        {
            failure = new RuleFailure(valEnv.Failures, valEnv.Message.AsString(), rule);
        }

        var failedData = result.IsFalse() ? valEnv.FailedData.Add(rule.Path) : valEnv.FailedData;
        var resetEnv = valEnv with
        {
            Properties = ImmutableDictionary<string, object?>.Empty,
            Message = ValueExpr.Null,
            Failures = [],
            FailedData = failedData
        };
        return (
            outEnv.UpdateValidatorState(_ => resetEnv) with
            {
                ValidData = dp => !failedData.Contains(dp)
            }
        ).WithValue(failure);
    }

    public static EnvironmentValue<IEnumerable<ResolvedRule>> EvaluateRule(
        this EvalEnvironment environment,
        Rule rule
    )
    {
        return environment.ResolveExpr(ToExpr(rule)).Map((v, e) => e.GetValidatorState().Rules);
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
            return new CallExpr(
                ValidatorEnvironment.RuleFunction,
                [pathRule.Path, pathRule.Must, pathRule.Props]
            );
        }

        EvalExpr DoRulesForEach(ForEachRule rules)
        {
            var ruleExpr = ToExpr(rules.Rule);
            if (rules.Variables != null)
                ruleExpr = rules.Variables with { In = ruleExpr };
            return CallExpr.Inbuilt(
                InbuiltFunction.Map,
                [rules.Path, new LambdaExpr(rules.Index.Name, ruleExpr)]
            );
        }
    }
}
