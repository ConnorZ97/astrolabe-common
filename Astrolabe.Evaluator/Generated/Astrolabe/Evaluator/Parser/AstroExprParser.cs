//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     ANTLR Version: 4.13.1
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

// Generated from /home/doolse/astrolabe/hvams.roadmanager.server/astrolabe-common/Astrolabe.Evaluator/AstroExpr.g4 by ANTLR 4.13.1

// Unreachable code detected
#pragma warning disable 0162
// The variable '...' is assigned but its value is never used
#pragma warning disable 0219
// Missing XML comment for publicly visible type or member '...'
#pragma warning disable 1591
// Ambiguous reference in cref attribute
#pragma warning disable 419

namespace Astrolabe.Evaluator.Parser {
using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Collections.Generic;
using Antlr4.Runtime;
using Antlr4.Runtime.Atn;
using Antlr4.Runtime.Misc;
using Antlr4.Runtime.Tree;
using DFA = Antlr4.Runtime.Dfa.DFA;

[System.CodeDom.Compiler.GeneratedCode("ANTLR", "4.13.1")]
[System.CLSCompliant(false)]
public partial class AstroExprParser : Parser {
	protected static DFA[] decisionToDFA;
	protected static PredictionContextCache sharedContextCache = new PredictionContextCache();
	public const int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, T__6=7, Number=8, LPAR=9, 
		RPAR=10, LBRAC=11, RBRAC=12, MINUS=13, PLUS=14, DOT=15, MUL=16, COMMA=17, 
		LESS=18, MORE_=19, LE=20, GE=21, APOS=22, QUOT=23, AND=24, OR=25, EQ=26, 
		NE=27, False=28, True=29, Null=30, COND=31, NOT=32, Literal=33, Whitespace=34, 
		Identifier=35;
	public const int
		RULE_main = 0, RULE_expr = 1, RULE_functionCall = 2, RULE_variableAssign = 3, 
		RULE_letExpr = 4, RULE_lambdaExpr = 5, RULE_variableReference = 6;
	public static readonly string[] ruleNames = {
		"main", "expr", "functionCall", "variableAssign", "letExpr", "lambdaExpr", 
		"variableReference"
	};

	private static readonly string[] _LiteralNames = {
		null, "'/'", "':'", "':='", "'let'", "'in'", "'=>'", "'$'", null, "'('", 
		"')'", "'['", "']'", "'-'", "'+'", "'.'", "'*'", "','", "'<'", "'>'", 
		"'<='", "'>='", "'''", "'\"'", "'and'", "'or'", "'='", "'!='", "'false'", 
		"'true'", "'null'", "'?'", "'!'"
	};
	private static readonly string[] _SymbolicNames = {
		null, null, null, null, null, null, null, null, "Number", "LPAR", "RPAR", 
		"LBRAC", "RBRAC", "MINUS", "PLUS", "DOT", "MUL", "COMMA", "LESS", "MORE_", 
		"LE", "GE", "APOS", "QUOT", "AND", "OR", "EQ", "NE", "False", "True", 
		"Null", "COND", "NOT", "Literal", "Whitespace", "Identifier"
	};
	public static readonly IVocabulary DefaultVocabulary = new Vocabulary(_LiteralNames, _SymbolicNames);

	[NotNull]
	public override IVocabulary Vocabulary
	{
		get
		{
			return DefaultVocabulary;
		}
	}

	public override string GrammarFileName { get { return "AstroExpr.g4"; } }

	public override string[] RuleNames { get { return ruleNames; } }

	public override int[] SerializedAtn { get { return _serializedATN; } }

	static AstroExprParser() {
		decisionToDFA = new DFA[_ATN.NumberOfDecisions];
		for (int i = 0; i < _ATN.NumberOfDecisions; i++) {
			decisionToDFA[i] = new DFA(_ATN.GetDecisionState(i), i);
		}
	}

		public AstroExprParser(ITokenStream input) : this(input, Console.Out, Console.Error) { }

		public AstroExprParser(ITokenStream input, TextWriter output, TextWriter errorOutput)
		: base(input, output, errorOutput)
	{
		Interpreter = new ParserATNSimulator(this, _ATN, decisionToDFA, sharedContextCache);
	}

	public partial class MainContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr() {
			return GetRuleContext<ExprContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Eof() { return GetToken(AstroExprParser.Eof, 0); }
		public MainContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_main; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitMain(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public MainContext main() {
		MainContext _localctx = new MainContext(Context, State);
		EnterRule(_localctx, 0, RULE_main);
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 14;
			expr(0);
			State = 15;
			Match(Eof);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public partial class ExprContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public FunctionCallContext functionCall() {
			return GetRuleContext<FunctionCallContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext[] expr() {
			return GetRuleContexts<ExprContext>();
		}
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr(int i) {
			return GetRuleContext<ExprContext>(i);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode MINUS() { return GetToken(AstroExprParser.MINUS, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode NOT() { return GetToken(AstroExprParser.NOT, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode PLUS() { return GetToken(AstroExprParser.PLUS, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public LambdaExprContext lambdaExpr() {
			return GetRuleContext<LambdaExprContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public VariableReferenceContext variableReference() {
			return GetRuleContext<VariableReferenceContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode LPAR() { return GetToken(AstroExprParser.LPAR, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode RPAR() { return GetToken(AstroExprParser.RPAR, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public LetExprContext letExpr() {
			return GetRuleContext<LetExprContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Literal() { return GetToken(AstroExprParser.Literal, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Number() { return GetToken(AstroExprParser.Number, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode False() { return GetToken(AstroExprParser.False, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode True() { return GetToken(AstroExprParser.True, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Null() { return GetToken(AstroExprParser.Null, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Identifier() { return GetToken(AstroExprParser.Identifier, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode DOT() { return GetToken(AstroExprParser.DOT, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode MUL() { return GetToken(AstroExprParser.MUL, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode LESS() { return GetToken(AstroExprParser.LESS, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode MORE_() { return GetToken(AstroExprParser.MORE_, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode LE() { return GetToken(AstroExprParser.LE, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode GE() { return GetToken(AstroExprParser.GE, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode EQ() { return GetToken(AstroExprParser.EQ, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode NE() { return GetToken(AstroExprParser.NE, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode AND() { return GetToken(AstroExprParser.AND, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode OR() { return GetToken(AstroExprParser.OR, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode COND() { return GetToken(AstroExprParser.COND, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode LBRAC() { return GetToken(AstroExprParser.LBRAC, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode RBRAC() { return GetToken(AstroExprParser.RBRAC, 0); }
		public ExprContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_expr; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitExpr(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public ExprContext expr() {
		return expr(0);
	}

	private ExprContext expr(int _p) {
		ParserRuleContext _parentctx = Context;
		int _parentState = State;
		ExprContext _localctx = new ExprContext(Context, _parentState);
		ExprContext _prevctx = _localctx;
		int _startState = 2;
		EnterRecursionRule(_localctx, 2, RULE_expr, _p);
		int _la;
		try {
			int _alt;
			EnterOuterAlt(_localctx, 1);
			{
			State = 34;
			ErrorHandler.Sync(this);
			switch ( Interpreter.AdaptivePredict(TokenStream,0,Context) ) {
			case 1:
				{
				State = 18;
				functionCall();
				}
				break;
			case 2:
				{
				State = 19;
				_la = TokenStream.LA(1);
				if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & 4294991872L) != 0)) ) {
				ErrorHandler.RecoverInline(this);
				}
				else {
					ErrorHandler.ReportMatch(this);
				    Consume();
				}
				State = 20;
				expr(20);
				}
				break;
			case 3:
				{
				State = 21;
				lambdaExpr();
				}
				break;
			case 4:
				{
				State = 22;
				variableReference();
				}
				break;
			case 5:
				{
				State = 23;
				Match(LPAR);
				State = 24;
				expr(0);
				State = 25;
				Match(RPAR);
				}
				break;
			case 6:
				{
				State = 27;
				letExpr();
				}
				break;
			case 7:
				{
				State = 28;
				Match(Literal);
				}
				break;
			case 8:
				{
				State = 29;
				Match(Number);
				}
				break;
			case 9:
				{
				State = 30;
				Match(False);
				}
				break;
			case 10:
				{
				State = 31;
				Match(True);
				}
				break;
			case 11:
				{
				State = 32;
				Match(Null);
				}
				break;
			case 12:
				{
				State = 33;
				Match(Identifier);
				}
				break;
			}
			Context.Stop = TokenStream.LT(-1);
			State = 70;
			ErrorHandler.Sync(this);
			_alt = Interpreter.AdaptivePredict(TokenStream,2,Context);
			while ( _alt!=2 && _alt!=global::Antlr4.Runtime.Atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( ParseListeners!=null )
						TriggerExitRuleEvent();
					_prevctx = _localctx;
					{
					State = 68;
					ErrorHandler.Sync(this);
					switch ( Interpreter.AdaptivePredict(TokenStream,1,Context) ) {
					case 1:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 36;
						if (!(Precpred(Context, 8))) throw new FailedPredicateException(this, "Precpred(Context, 8)");
						State = 37;
						Match(DOT);
						State = 38;
						expr(9);
						}
						break;
					case 2:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 39;
						if (!(Precpred(Context, 7))) throw new FailedPredicateException(this, "Precpred(Context, 7)");
						State = 40;
						_la = TokenStream.LA(1);
						if ( !(_la==T__0 || _la==MUL) ) {
						ErrorHandler.RecoverInline(this);
						}
						else {
							ErrorHandler.ReportMatch(this);
						    Consume();
						}
						State = 41;
						expr(8);
						}
						break;
					case 3:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 42;
						if (!(Precpred(Context, 6))) throw new FailedPredicateException(this, "Precpred(Context, 6)");
						State = 43;
						_la = TokenStream.LA(1);
						if ( !(_la==MINUS || _la==PLUS) ) {
						ErrorHandler.RecoverInline(this);
						}
						else {
							ErrorHandler.ReportMatch(this);
						    Consume();
						}
						State = 44;
						expr(7);
						}
						break;
					case 4:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 45;
						if (!(Precpred(Context, 5))) throw new FailedPredicateException(this, "Precpred(Context, 5)");
						State = 46;
						_la = TokenStream.LA(1);
						if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & 3932160L) != 0)) ) {
						ErrorHandler.RecoverInline(this);
						}
						else {
							ErrorHandler.ReportMatch(this);
						    Consume();
						}
						State = 47;
						expr(6);
						}
						break;
					case 5:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 48;
						if (!(Precpred(Context, 4))) throw new FailedPredicateException(this, "Precpred(Context, 4)");
						State = 49;
						_la = TokenStream.LA(1);
						if ( !(_la==EQ || _la==NE) ) {
						ErrorHandler.RecoverInline(this);
						}
						else {
							ErrorHandler.ReportMatch(this);
						    Consume();
						}
						State = 50;
						expr(5);
						}
						break;
					case 6:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 51;
						if (!(Precpred(Context, 3))) throw new FailedPredicateException(this, "Precpred(Context, 3)");
						State = 52;
						Match(AND);
						State = 53;
						expr(4);
						}
						break;
					case 7:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 54;
						if (!(Precpred(Context, 2))) throw new FailedPredicateException(this, "Precpred(Context, 2)");
						State = 55;
						Match(OR);
						State = 56;
						expr(3);
						}
						break;
					case 8:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 57;
						if (!(Precpred(Context, 1))) throw new FailedPredicateException(this, "Precpred(Context, 1)");
						State = 58;
						Match(COND);
						State = 59;
						expr(0);
						State = 60;
						Match(T__1);
						State = 61;
						expr(1);
						}
						break;
					case 9:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						PushNewRecursionContext(_localctx, _startState, RULE_expr);
						State = 63;
						if (!(Precpred(Context, 9))) throw new FailedPredicateException(this, "Precpred(Context, 9)");
						State = 64;
						Match(LBRAC);
						State = 65;
						expr(0);
						State = 66;
						Match(RBRAC);
						}
						break;
					}
					} 
				}
				State = 72;
				ErrorHandler.Sync(this);
				_alt = Interpreter.AdaptivePredict(TokenStream,2,Context);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			UnrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	public partial class FunctionCallContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public VariableReferenceContext variableReference() {
			return GetRuleContext<VariableReferenceContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode LPAR() { return GetToken(AstroExprParser.LPAR, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode RPAR() { return GetToken(AstroExprParser.RPAR, 0); }
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext[] expr() {
			return GetRuleContexts<ExprContext>();
		}
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr(int i) {
			return GetRuleContext<ExprContext>(i);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode[] COMMA() { return GetTokens(AstroExprParser.COMMA); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode COMMA(int i) {
			return GetToken(AstroExprParser.COMMA, i);
		}
		public FunctionCallContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_functionCall; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitFunctionCall(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public FunctionCallContext functionCall() {
		FunctionCallContext _localctx = new FunctionCallContext(Context, State);
		EnterRule(_localctx, 4, RULE_functionCall);
		int _la;
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 73;
			variableReference();
			State = 74;
			Match(LPAR);
			State = 83;
			ErrorHandler.Sync(this);
			_la = TokenStream.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 49123713936L) != 0)) {
				{
				State = 75;
				expr(0);
				State = 80;
				ErrorHandler.Sync(this);
				_la = TokenStream.LA(1);
				while (_la==COMMA) {
					{
					{
					State = 76;
					Match(COMMA);
					State = 77;
					expr(0);
					}
					}
					State = 82;
					ErrorHandler.Sync(this);
					_la = TokenStream.LA(1);
				}
				}
			}

			State = 85;
			Match(RPAR);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public partial class VariableAssignContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public VariableReferenceContext variableReference() {
			return GetRuleContext<VariableReferenceContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr() {
			return GetRuleContext<ExprContext>(0);
		}
		public VariableAssignContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_variableAssign; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitVariableAssign(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public VariableAssignContext variableAssign() {
		VariableAssignContext _localctx = new VariableAssignContext(Context, State);
		EnterRule(_localctx, 6, RULE_variableAssign);
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 87;
			variableReference();
			State = 88;
			Match(T__2);
			State = 89;
			expr(0);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public partial class LetExprContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr() {
			return GetRuleContext<ExprContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public VariableAssignContext[] variableAssign() {
			return GetRuleContexts<VariableAssignContext>();
		}
		[System.Diagnostics.DebuggerNonUserCode] public VariableAssignContext variableAssign(int i) {
			return GetRuleContext<VariableAssignContext>(i);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode[] COMMA() { return GetTokens(AstroExprParser.COMMA); }
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode COMMA(int i) {
			return GetToken(AstroExprParser.COMMA, i);
		}
		public LetExprContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_letExpr; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitLetExpr(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public LetExprContext letExpr() {
		LetExprContext _localctx = new LetExprContext(Context, State);
		EnterRule(_localctx, 8, RULE_letExpr);
		int _la;
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 91;
			Match(T__3);
			{
			State = 92;
			variableAssign();
			State = 97;
			ErrorHandler.Sync(this);
			_la = TokenStream.LA(1);
			while (_la==COMMA) {
				{
				{
				State = 93;
				Match(COMMA);
				State = 94;
				variableAssign();
				}
				}
				State = 99;
				ErrorHandler.Sync(this);
				_la = TokenStream.LA(1);
			}
			}
			State = 100;
			Match(T__4);
			State = 101;
			expr(0);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public partial class LambdaExprContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public VariableReferenceContext variableReference() {
			return GetRuleContext<VariableReferenceContext>(0);
		}
		[System.Diagnostics.DebuggerNonUserCode] public ExprContext expr() {
			return GetRuleContext<ExprContext>(0);
		}
		public LambdaExprContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_lambdaExpr; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitLambdaExpr(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public LambdaExprContext lambdaExpr() {
		LambdaExprContext _localctx = new LambdaExprContext(Context, State);
		EnterRule(_localctx, 10, RULE_lambdaExpr);
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 103;
			variableReference();
			State = 104;
			Match(T__5);
			State = 105;
			expr(0);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public partial class VariableReferenceContext : ParserRuleContext {
		[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode Identifier() { return GetToken(AstroExprParser.Identifier, 0); }
		public VariableReferenceContext(ParserRuleContext parent, int invokingState)
			: base(parent, invokingState)
		{
		}
		public override int RuleIndex { get { return RULE_variableReference; } }
		[System.Diagnostics.DebuggerNonUserCode]
		public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {
			IAstroExprVisitor<TResult> typedVisitor = visitor as IAstroExprVisitor<TResult>;
			if (typedVisitor != null) return typedVisitor.VisitVariableReference(this);
			else return visitor.VisitChildren(this);
		}
	}

	[RuleVersion(0)]
	public VariableReferenceContext variableReference() {
		VariableReferenceContext _localctx = new VariableReferenceContext(Context, State);
		EnterRule(_localctx, 12, RULE_variableReference);
		try {
			EnterOuterAlt(_localctx, 1);
			{
			State = 107;
			Match(T__6);
			State = 108;
			Match(Identifier);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			ErrorHandler.ReportError(this, re);
			ErrorHandler.Recover(this, re);
		}
		finally {
			ExitRule();
		}
		return _localctx;
	}

	public override bool Sempred(RuleContext _localctx, int ruleIndex, int predIndex) {
		switch (ruleIndex) {
		case 1: return expr_sempred((ExprContext)_localctx, predIndex);
		}
		return true;
	}
	private bool expr_sempred(ExprContext _localctx, int predIndex) {
		switch (predIndex) {
		case 0: return Precpred(Context, 8);
		case 1: return Precpred(Context, 7);
		case 2: return Precpred(Context, 6);
		case 3: return Precpred(Context, 5);
		case 4: return Precpred(Context, 4);
		case 5: return Precpred(Context, 3);
		case 6: return Precpred(Context, 2);
		case 7: return Precpred(Context, 1);
		case 8: return Precpred(Context, 9);
		}
		return true;
	}

	private static int[] _serializedATN = {
		4,1,35,111,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,1,0,
		1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
		1,1,1,3,1,35,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
		1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
		1,1,5,1,69,8,1,10,1,12,1,72,9,1,1,2,1,2,1,2,1,2,1,2,5,2,79,8,2,10,2,12,
		2,82,9,2,3,2,84,8,2,1,2,1,2,1,3,1,3,1,3,1,3,1,4,1,4,1,4,1,4,5,4,96,8,4,
		10,4,12,4,99,9,4,1,4,1,4,1,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,0,1,2,7,0,
		2,4,6,8,10,12,0,5,2,0,13,14,32,32,2,0,1,1,16,16,1,0,13,14,1,0,18,21,1,
		0,26,27,126,0,14,1,0,0,0,2,34,1,0,0,0,4,73,1,0,0,0,6,87,1,0,0,0,8,91,1,
		0,0,0,10,103,1,0,0,0,12,107,1,0,0,0,14,15,3,2,1,0,15,16,5,0,0,1,16,1,1,
		0,0,0,17,18,6,1,-1,0,18,35,3,4,2,0,19,20,7,0,0,0,20,35,3,2,1,20,21,35,
		3,10,5,0,22,35,3,12,6,0,23,24,5,9,0,0,24,25,3,2,1,0,25,26,5,10,0,0,26,
		35,1,0,0,0,27,35,3,8,4,0,28,35,5,33,0,0,29,35,5,8,0,0,30,35,5,28,0,0,31,
		35,5,29,0,0,32,35,5,30,0,0,33,35,5,35,0,0,34,17,1,0,0,0,34,19,1,0,0,0,
		34,21,1,0,0,0,34,22,1,0,0,0,34,23,1,0,0,0,34,27,1,0,0,0,34,28,1,0,0,0,
		34,29,1,0,0,0,34,30,1,0,0,0,34,31,1,0,0,0,34,32,1,0,0,0,34,33,1,0,0,0,
		35,70,1,0,0,0,36,37,10,8,0,0,37,38,5,15,0,0,38,69,3,2,1,9,39,40,10,7,0,
		0,40,41,7,1,0,0,41,69,3,2,1,8,42,43,10,6,0,0,43,44,7,2,0,0,44,69,3,2,1,
		7,45,46,10,5,0,0,46,47,7,3,0,0,47,69,3,2,1,6,48,49,10,4,0,0,49,50,7,4,
		0,0,50,69,3,2,1,5,51,52,10,3,0,0,52,53,5,24,0,0,53,69,3,2,1,4,54,55,10,
		2,0,0,55,56,5,25,0,0,56,69,3,2,1,3,57,58,10,1,0,0,58,59,5,31,0,0,59,60,
		3,2,1,0,60,61,5,2,0,0,61,62,3,2,1,1,62,69,1,0,0,0,63,64,10,9,0,0,64,65,
		5,11,0,0,65,66,3,2,1,0,66,67,5,12,0,0,67,69,1,0,0,0,68,36,1,0,0,0,68,39,
		1,0,0,0,68,42,1,0,0,0,68,45,1,0,0,0,68,48,1,0,0,0,68,51,1,0,0,0,68,54,
		1,0,0,0,68,57,1,0,0,0,68,63,1,0,0,0,69,72,1,0,0,0,70,68,1,0,0,0,70,71,
		1,0,0,0,71,3,1,0,0,0,72,70,1,0,0,0,73,74,3,12,6,0,74,83,5,9,0,0,75,80,
		3,2,1,0,76,77,5,17,0,0,77,79,3,2,1,0,78,76,1,0,0,0,79,82,1,0,0,0,80,78,
		1,0,0,0,80,81,1,0,0,0,81,84,1,0,0,0,82,80,1,0,0,0,83,75,1,0,0,0,83,84,
		1,0,0,0,84,85,1,0,0,0,85,86,5,10,0,0,86,5,1,0,0,0,87,88,3,12,6,0,88,89,
		5,3,0,0,89,90,3,2,1,0,90,7,1,0,0,0,91,92,5,4,0,0,92,97,3,6,3,0,93,94,5,
		17,0,0,94,96,3,6,3,0,95,93,1,0,0,0,96,99,1,0,0,0,97,95,1,0,0,0,97,98,1,
		0,0,0,98,100,1,0,0,0,99,97,1,0,0,0,100,101,5,5,0,0,101,102,3,2,1,0,102,
		9,1,0,0,0,103,104,3,12,6,0,104,105,5,6,0,0,105,106,3,2,1,0,106,11,1,0,
		0,0,107,108,5,7,0,0,108,109,5,35,0,0,109,13,1,0,0,0,6,34,68,70,80,83,97
	};

	public static readonly ATN _ATN =
		new ATNDeserializer().Deserialize(_serializedATN);


}
} // namespace Astrolabe.Evaluator.Parser
