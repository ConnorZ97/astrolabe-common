﻿using System.Text.Json.Nodes;

namespace Astrolabe.Validation;

public enum InbuiltFunction
{
    Eq,
    Lt,
    LtEq,
    Gt,
    GtEq,
    Ne,
    And,
    Or,
    Not,
    Add,
    Minus,
    Multiply,
    Divide,
    WithMessage,
    WithProperty,
    IfElse,
    Sum,
    Count
}


public interface Expr;

public interface ExprValue : Expr
{
    public static readonly NullValue Null = new();
}

public record NullValue : ExprValue;

public record BoolValue(bool Value) : ExprValue;

public record NumberValue(long? LongValue, double? DoubleValue) : ExprValue
{
    public long ToTruncated()
    {
        return LongValue ?? (long)DoubleValue!;
    }
    public double AsDouble()
    {
        return DoubleValue ?? LongValue!.Value;
    }

    public static implicit operator NumberValue(long l)
    {
        return new NumberValue(l, null);
    }
}

public record StringValue(string Value) : ExprValue;

public record ArrayExpr(IEnumerable<Expr> ValueExpr) : Expr;

public record ArrayValue(IEnumerable<ExprValue> Values) : ExprValue;

public record ObjectValue(JsonObject JsonObject) : ExprValue;

public record MapExpr(PathExpr Path, Expr Index, Expr Value) : Expr;

public record CallExpr(InbuiltFunction Function, ICollection<Expr> Args) : Expr
{
    public override string ToString()
    {
        return $"{Function}({string.Join(", ", Args)})";
    }
}

public record GetData(PathExpr Path) : Expr;

public class IndexExpr : Expr;

public record RunningIndex(Expr CountExpr) : Expr;

public static class ValueExtensions
{
    public static ExprValue ToExpr(this object? v)
    {
        return v switch
        {
            null => ExprValue.Null,
            bool b => new BoolValue(b),
            string s => new StringValue(s),
            int i => new NumberValue(i, null),
            long l => new NumberValue(l, null),
            double d => new NumberValue(null, d),
        };
    }
    
    public static bool AsBool(this ExprValue v)
    {
        return ((BoolValue)v).Value;
    }

    public static string AsString(this ExprValue v)
    {
        return ((StringValue)v).Value;
    }

    public static Expr AndExpr(this Expr? expr, Expr other)
    {
        return expr == null ? other : new CallExpr(InbuiltFunction.And, [expr, other]);
    }
    
}
public record PathExpr(Expr Segment, PathExpr? Parent)
{
    public override string ToString()
    {
        return Parent != null ? $"{Parent}.{Segment}" : Segment.ToString()!;
    }

    public PathExpr Index(int number)
    {
        return new PathExpr(number.ToExpr(), this);
    }

    public static implicit operator PathExpr(string path)
    {
        return new PathExpr(path.ToExpr(), null);
    }
    
    public static PathExpr IndexPath(int index, PathExpr? parent)
    {
        return new PathExpr(index.ToExpr(), parent);
    }
}
