import { parser } from "./parser";
import { SyntaxNode } from "@lezer/common";
import {
  callExpr,
  EvalExpr,
  pathExpr,
  segmentPath,
  valueExpr,
  VarExpr,
  varExpr,
} from "./nodes";

export function parseEval(input: string) {
  const parseTree = parser.parse(input);
  return visit(parseTree.topNode);

  function visit(node: SyntaxNode | null): EvalExpr {
    if (node == null) throw "Couldn't find node";
    const nodeName = node.type.name;
    switch (nodeName) {
      case "ParenthesizedExpression":
      case "EvalProgram":
        return visit(node.getChild("Expression"));
      case "Reference":
        return varExpr(getNodeText(node).substring(1));
      case "CallExpression":
        const func = visit(node.getChild("Expression"));
        const args = node
          .getChild("ArgList")!
          .getChildren("Expression")
          .map(visit);
        return callExpr((func as VarExpr).variable, args);
      case "Number":
        return valueExpr(parseFloat(getNodeText(node)));
      case "String":
        const quoted = getNodeText(node);
        return valueExpr(quoted.substring(1, quoted.length - 1));
      case "Identifier":
        return pathExpr(segmentPath(input.substring(node.from, node.to)));
      case "BinaryExpression":
        const callNode = node.getChild("Call")!;
        return callExpr(
          input.substring(callNode.from, callNode.to),
          node.getChildren("Expression").map(visit),
        );
      default:
        throw "Don't know what to do with:" + nodeName;
    }
    // return {
    //   type: "path",
    //   path: segmentPath(input.substring(node.from, node.to)),
    // };
  }

  function getNodeText(node: SyntaxNode) {
    return input.substring(node.from, node.to);
  }
}
