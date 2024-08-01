using System.Text.Json;
using System.Text.Json.Nodes;
using Astrolabe.Evaluator;
using Astrolabe.Evaluator.Functions;
using Microsoft.AspNetCore.Mvc;

namespace Astrolabe.TestTemplate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EvalController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<JsonElement>> Eval([FromBody] EvalData evalData)
    {
        var env = JsonDataLookup
            .EnvironmentFor(JsonSerializer.SerializeToNode(evalData.Data))
            .AddDefaultFunctions();
        return Ok(env.ResolveAndEvaluate(ExprParser.Parse(evalData.Expression)).Value.ToNative());
    }
}

public record EvalData(string Expression, IDictionary<string, object?> Data);
