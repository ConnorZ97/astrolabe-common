using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.Json.Serialization;
using System.Xml.Serialization;
using Astrolabe.Annotation;
using Astrolabe.CodeGen;
using Astrolabe.CodeGen.Typescript;

namespace Astrolabe.Schemas.CodeGen;

public class SchemaFieldsInstanceGenerator : CodeGenerator<SimpleTypeData, FieldsForType>
{
    private readonly SchemaFieldsGeneratorOptions _options;
    
    private readonly Dictionary<Type, IEnumerable<SchemaField>> _typeToFields = new();
    
    public SchemaFieldsInstanceGenerator(SchemaFieldsGeneratorOptions options) : base(options, new SimpleTypeVisitor())
    {
        _options = options;
    }
    
    protected override string TypeKey(SimpleTypeData typeData)
    {
        return typeData switch
        {
            EnumerableTypeData enumerableTypeData => enumerableTypeData.Element().Type.Name+"[]",
            ObjectTypeData objectTypeData => objectTypeData.Type.Name,
            _ => ""
        };
    }

    protected override IEnumerable<FieldsForType> ToData(SimpleTypeData typeData)
    {
        return typeData switch
        {
            EnumerableTypeData enumerableTypeData => CollectData(enumerableTypeData.Element()),
            ObjectTypeData objectTypeData => ObjectDeclarations(objectTypeData),
            _ => Array.Empty<FieldsForType>()
        };

        IEnumerable<FieldsForType> ObjectDeclarations(ObjectTypeData objectTypeData)
        {
            var type = objectTypeData.Type;
            var members = objectTypeData.Members.Where(x =>
                x.Properties.First().GetCustomAttribute<JsonExtensionDataAttribute>() == null).ToList();
            
            var deps = objectTypeData.Members.SelectMany(x => CollectData(x.Data()));

            var baseType = type.GetCustomAttribute<JsonBaseTypeAttribute>();
            var subTypes = type.GetCustomAttributes<JsonSubTypeAttribute>();

            var fieldList = members.Select(x => FieldForMember(x, objectTypeData, baseType, subTypes));

            _typeToFields[type] = fieldList;
            return deps.Append(new FieldsForType(type, fieldList));
        }
    }

    private SchemaField FieldForMember(TypeMember<SimpleTypeData> member, ObjectTypeData parent,
        JsonBaseTypeAttribute? baseType, IEnumerable<JsonSubTypeAttribute> subTypes)
    {
        var onlyForTypes =
            member.Properties.Select(x => subTypes.FirstOrDefault(s => s.SubType == x.DeclaringType)?.Discriminator)
                .Cast<string>().ToList();
        var memberData = member.Data();
        var schemaField = FieldForType(memberData, parent, member.FieldName);
        var firstProp = member.Properties.First();
        var tags = firstProp.GetCustomAttributes<SchemaTagAttribute>().Select(x => x.Tag).ToList();
        var enumType = firstProp.GetCustomAttribute<SchemaOptionsAttribute>()?.EnumType ?? GetEnumType(memberData);
        var options = enumType != null ? EnumOptions(enumType, IsStringEnum(enumType)) : null;
        schemaField.IsTypeField = baseType != null && baseType.TypeField == member.FieldName ? true : null;
        schemaField.OnlyForTypes = onlyForTypes.Count > 0 ? onlyForTypes : null;
        schemaField.Required = memberData.Nullable ? null : true;
        schemaField.DefaultValue = firstProp.GetCustomAttribute<DefaultValueAttribute>()?.Value;
        schemaField.DisplayName = firstProp.GetCustomAttribute<DisplayAttribute>()?.Name ?? firstProp.Name;
        schemaField.Tags = tags.Count > 0 ? tags : null;
        schemaField.Options = options;
        return schemaField;
    }

    private Type? GetEnumType(SimpleTypeData data)
    {     
        return data switch
        {
            EnumerableTypeData enumerableTypeData => GetEnumType(enumerableTypeData.Element()),
            { Type.IsEnum: true } => data.Type,
            _ => null
        };
    }

    private static FieldType FieldTypeForTypeOnly(Type type)
    {
        return type switch
        {
            { IsEnum: true } when IsStringEnum(type) is var stringEnum => stringEnum ? FieldType.String : FieldType.Int,
            _ when type == typeof(DateTime) => FieldType.DateTime,
            _ when type == typeof(DateTimeOffset) => FieldType.DateTime,
            _ when type == typeof(DateOnly) => FieldType.Date,
            _ when type == typeof(string) || type == typeof(Guid) => FieldType.String,
            _ when type == typeof(int) || type == typeof(long) => FieldType.Int,
            _ when type == typeof(double) => FieldType.Double,
            _ when type == typeof(bool) => FieldType.Bool,
            _ when type == typeof(object) => FieldType.Any,
            _ => FieldType.Any
        };
    }

    private SchemaField FieldForType(SimpleTypeData simpleType, ObjectTypeData parentObject, string field)
    {
        var fieldType = _options.CustomFieldType?.Invoke(simpleType.Type);
        if (fieldType != null)
        {
            return new SimpleSchemaField(fieldType, field);
        }

        return simpleType switch
        {
            EnumerableTypeData enumerableTypeData => MakeCollection(FieldForType(enumerableTypeData.Element(), parentObject, field)),
            ObjectTypeData objectTypeData => DoObject(objectTypeData),
            _ => new SimpleSchemaField(FieldTypeForTypeOnly(simpleType.Type).ToString(), field)
        };

        SchemaField MakeCollection(SchemaField sf)
        {
            sf.Collection = true;
            return sf;
        }

        CompoundField DoObject(ObjectTypeData objectTypeData)
        {
            var treeChildren = objectTypeData == parentObject;
            return new CompoundField(field,
                treeChildren ? new SchemaField[] { } : _typeToFields[objectTypeData.Type], treeChildren);
        }
    }

    private static bool IsStringEnum(Type type)
    {
        return type.GetCustomAttribute<JsonStringAttribute>() != null;
    }

    private static IEnumerable<FieldOption> EnumOptions(Type type, bool stringEnum)
    {
        return type.GetFields(BindingFlags.Static | BindingFlags.Public)
            .Select(x =>
                (Attribute.GetCustomAttribute(x, typeof(DisplayAttribute)),
                        Attribute.GetCustomAttribute(x, typeof(XmlEnumAttribute))) switch
                    {
                        (DisplayAttribute a, _) => new FieldOption(a.Name!, GetValue(x)),
                        (_, XmlEnumAttribute a) => new FieldOption(a.Name!, GetValue(x)),
                        _ => new FieldOption(x.Name, GetValue(x))
                    });

        object GetValue(FieldInfo info)
        {
            return stringEnum ? info.Name : (int)info.GetValue(null)!;
        }
    }
}

public record FieldsForType(Type Type, IEnumerable<SchemaField> Fields);
