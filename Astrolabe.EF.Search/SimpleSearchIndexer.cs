using System.Reflection;
using System.Text.Json;
using Astrolabe.Annotation;
using Azure.Core.Serialization;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;

namespace Astrolabe.EF.Search;

public class SimpleSearchIndexer<T>
{
    private readonly JsonSerializerOptions? _options;
    private readonly SearchField[] _textFieldList;
    private readonly SearchField[] _filterFieldList;
    public SearchField[] KeywordFields { get; init; }

    public SimpleSearchIndexer(JsonSerializerOptions? options = null, Func<SearchField, bool>? textFields = null,
        Func<SearchField, bool>? filterFields = null)
    {
        _options = options;
        var serializer = options != null ? new JsonObjectSerializer(options) : new JsonObjectSerializer();
        var fields = new FieldBuilder { Serializer = serializer }.Build(typeof(T))
            .Concat(GetEnumFields(typeof(T), serializer)).ToList();
        _textFieldList = fields.Where(textFields ?? (x => x.IsSearchable.GetValueOrDefault() && x.AnalyzerName != "keyword")).ToArray();
        _filterFieldList = fields.Where(filterFields ?? (x => x.IsFilterable.GetValueOrDefault() || x.AnalyzerName == "keyword")).ToArray();
        KeywordFields = fields.Where(x => x.AnalyzerName == "keyword").ToArray();
    }

    public SimpleSearchDocument Index(T doc)
    {
        var jsonDoc = JsonSerializer.SerializeToElement(doc, _options);
        var searchStrings = _textFieldList.SelectMany(x => jsonDoc.TryGetProperty(x.Name, out var value)
            ? new[] { (ElementValue(value, x.Type)?.ToString() ?? "").Trim() }
            : Enumerable.Empty<string>()).Where(x => !string.IsNullOrEmpty(x));
        
        return new SimpleSearchDocument(string.Join(" ", searchStrings), _filterFieldList.SelectMany(x =>
            jsonDoc.TryGetProperty(x.Name, out var value)
                ? new FieldValue[] { new(x.Name, ElementValue(value, x.Type)) }
                : Enumerable.Empty<FieldValue>()));
    }

    private static string ElementValue(JsonElement element, SearchFieldDataType type)
    {
        return type.ToString() switch
        {
            "Edm.String" => element.GetString() ?? "",
            "Edm.Int32" => element.GetInt32().ToString(),
            "Edm.Int64" => element.GetInt64().ToString(),
            _ => throw new ArgumentOutOfRangeException()
        };
    }

    private static IEnumerable<SearchField> GetEnumFields(Type type, JsonObjectSerializer serializer)
    {
        var convert = (IMemberNameConverter)serializer;
        return type.GetProperties(BindingFlags.Public | BindingFlags.Instance).SelectMany(p =>
        {
            var name = convert.ConvertMemberName(p);
            var enumType = GetEnumType(p.PropertyType);
            return enumType != null ? [CreateSimpleField()] : Array.Empty<SearchField>();

            SearchField CreateSimpleField()
            {
                var isStringEnum = enumType.GetCustomAttribute<JsonStringAttribute>() != null;
                SearchField field = new SimpleField(name,
                    isStringEnum ? SearchFieldDataType.String : SearchFieldDataType.Int32);
                foreach (var attribute in p.GetCustomAttributes())
                {
                    switch (attribute)
                    {
                        case SearchableFieldAttribute sf:
                            field.IsSearchable = true;
                            ProcessSimpleField(sf);
                            break;
                        case SimpleFieldAttribute simpleField:
                            ProcessSimpleField(simpleField);
                            break;
                    }
                }

                return field;

                void ProcessSimpleField(SimpleFieldAttribute sf)
                {
                    if (sf.IsFilterable)
                        field.IsFilterable = sf.IsFilterable;
                }
            }
        });

        Type? GetEnumType(Type t)
        {
            if (t.IsEnum)
                return t;
            if (t.IsConstructedGenericType && t.GetGenericTypeDefinition() == typeof(Nullable<>))
                return GetEnumType(t.GenericTypeArguments[0]);
            return null;
        }
    }
}