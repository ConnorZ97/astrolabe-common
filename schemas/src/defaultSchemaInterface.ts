import { Control } from "@react-typed-forms/core";
import {
  FieldOption,
  FieldType,
  SchemaDataNode,
  SchemaField,
  SchemaInterface,
  SchemaNode,
  ValidationMessageType,
} from "./schemaField";

export class DefaultSchemaInterface implements SchemaInterface {
  constructor(
    protected boolStrings: [string, string] = ["No", "Yes"],
    protected parseDateTime: (s: string) => number = (s) => Date.parse(s),
  ) {}

  parseToMillis(field: SchemaField, v: string): number {
    return this.parseDateTime(v);
  }

  validationMessageText(
    field: SchemaField,
    messageType: ValidationMessageType,
    actual: any,
    expected: any,
  ): string {
    switch (messageType) {
      case ValidationMessageType.NotEmpty:
        return "Please enter a value";
      case ValidationMessageType.MinLength:
        return "Length must be at least " + expected;
      case ValidationMessageType.MaxLength:
        return "Length must be less than " + expected;
      case ValidationMessageType.NotBeforeDate:
        return `Date must not be before ${new Date(expected).toDateString()}`;
      case ValidationMessageType.NotAfterDate:
        return `Date must not be after ${new Date(expected).toDateString()}`;
      default:
        return "Unknown error";
    }
  }

  getDataOptions(node: SchemaDataNode): FieldOption[] | null | undefined {
    return this.getNodeOptions(node.schema);
  }

  getNodeOptions(node: SchemaNode): FieldOption[] | null | undefined {
    return this.getOptions(node.field);
  }

  getOptions({ options }: SchemaField): FieldOption[] | null | undefined {
    return options && options.length > 0 ? options : null;
  }

  getFilterOptions(
    array: SchemaDataNode,
    field: SchemaNode,
  ): FieldOption[] | undefined | null {
    return this.getNodeOptions(field);
  }

  isEmptyValue(f: SchemaField, value: any): boolean {
    if (f.collection)
      return Array.isArray(value) ? value.length === 0 : value == null;
    switch (f.type) {
      case FieldType.String:
      case FieldType.DateTime:
      case FieldType.Date:
      case FieldType.Time:
        return !value;
      default:
        return value == null;
    }
  }

  searchText(field: SchemaField, value: any): string {
    return this.textValue(field, value)?.toLowerCase() ?? "";
  }

  textValue(
    field: SchemaField,
    value: any,
    element?: boolean | undefined,
  ): string | undefined {
    const options = this.getOptions(field);
    const option = options?.find((x) => x.value === value);
    if (option) return option.name;
    switch (field.type) {
      case FieldType.Date:
        return value ? new Date(value).toLocaleDateString() : undefined;
      case FieldType.DateTime:
        return value
          ? new Date(this.parseToMillis(field, value)).toLocaleString()
          : undefined;
      case FieldType.Time:
        return value
          ? new Date("1970-01-01T" + value).toLocaleTimeString()
          : undefined;
      case FieldType.Bool:
        return this.boolStrings[value ? 1 : 0];
      default:
        return value != null ? value.toString() : undefined;
    }
  }

  controlLength(f: SchemaField, control: Control<any>): number {
    return f.collection
      ? (control.elements?.length ?? 0)
      : this.valueLength(f, control.value);
  }

  valueLength(field: SchemaField, value: any): number {
    return (value && value?.length) ?? 0;
  }

  compareValue(field: SchemaField, v1: unknown, v2: unknown): number {
    if (v1 == null) return v2 == null ? 0 : 1;
    if (v2 == null) return -1;
    switch (field.type) {
      case FieldType.Date:
      case FieldType.DateTime:
      case FieldType.Time:
      case FieldType.String:
        return (v1 as string).localeCompare(v2 as string);
      case FieldType.Bool:
        return (v1 as boolean) ? ((v2 as boolean) ? 0 : 1) : -1;
      case FieldType.Int:
      case FieldType.Double:
        return (v1 as number) - (v2 as number);
      default:
        return 0;
    }
  }
}

export const defaultSchemaInterface: SchemaInterface =
  new DefaultSchemaInterface();
