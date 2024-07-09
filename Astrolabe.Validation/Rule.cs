using System.Numerics;
using System.Runtime.InteropServices;
using Astrolabe.JSON;

namespace Astrolabe.Validation;

public interface RuleBuilder<T, TProp>
{
    PathExpr Path { get; }

    Expr? Must { get; }
}

public record SimpleRuleBuilder<T, TProp>(PathExpr Path) : RuleBuilder<T, TProp>
{
    public Expr? Must => null;
}

public interface Rule<T>;

public interface PathRule<T> : Rule<T>
{
    PathExpr Path { get; }

    Expr Must { get; }
}

public interface RuleAndBuilder<T, TProp> : Rule<T>, RuleBuilder<T, TProp>
{
    Expr RuleExpr { get; }
}

public record PathRules<T, TProp>(PathExpr Path, Expr Must) : RuleAndBuilder<T, TProp>, PathRule<T>
{
    public Expr RuleExpr => Must;
}

public record RulesForEach<T>(PathExpr Path, Expr Index, IEnumerable<Rule<T>> Rules) : Rule<T>
{
    public IEnumerable<Expr> Musts => [];
}

public record ResolvedRule<T>(JsonPathSegments Path, Expr Must);

public static class RuleExtensions
{
    public static PathRules<T, TN> Must<T, TN>(this RuleBuilder<T, TN> ruleFor, Func<NumberExpr, BoolExpr> must)
        where TN : struct, ISignedNumber<TN>
    {
        var path = ruleFor.Path;
        return new PathRules<T, TN>(path, ruleFor.Must.AndExpr(must(new NumberExpr(new GetData(path))).Expr));
    }

    public static PathRules<T, bool> Must<T>(this RuleBuilder<T, bool> ruleFor, Func<BoolExpr, BoolExpr> must)
    {
        var path = ruleFor.Path;
        return new PathRules<T, bool>(path, ruleFor.Must.AndExpr(must(new BoolExpr(new GetData(path))).Expr));
    }

    public static PathRules<T, TN> WithMessage<T, TN>(this RuleAndBuilder<T, TN> ruleFor, string message)
    {
        return new PathRules<T, TN>(ruleFor.Path,
            new CallExpr(InbuiltFunction.WithMessage, [ruleFor.RuleExpr, new StringValue(message)]));
    }

    public static PathRules<T, TN> Min<T, TN>(this RuleBuilder<T, TN> ruleFor, TN value, bool exclusive = false)
    {
        return new PathRules<T, TN>(ruleFor.Path,
            ruleFor.Must.AndExpr(new CallExpr(exclusive ? InbuiltFunction.Gt : InbuiltFunction.GtEq,
                [new GetData(ruleFor.Path), value.ToExpr()])));
    }
    
    public static PathRules<T, TN> IfElse<T, TN>(this RuleBuilder<T, TN> ruleFor, BoolExpr ifExpr, Func<RuleBuilder<T, TN>, PathRule<T>> trueExpr, Func<RuleBuilder<T, TN>, PathRule<T>> falseExpr)
    {
        return new PathRules<T, TN>(ruleFor.Path,
            ruleFor.Must.AndExpr(new CallExpr(InbuiltFunction.IfElse,
                [ifExpr.Expr, trueExpr(ruleFor).Must, falseExpr(ruleFor).Must])));
        
    }
    

    public static PathRules<T, TN> Max<T, TN>(this RuleBuilder<T, TN> ruleFor, TN value, bool exclusive = false)
    {
        return new PathRules<T, TN>(ruleFor.Path,
            ruleFor.Must.AndExpr(new CallExpr(exclusive ? InbuiltFunction.Lt : InbuiltFunction.LtEq,
                [new GetData(ruleFor.Path), value.ToExpr()])));
    }
}