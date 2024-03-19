import { Control, newControl } from "@react-typed-forms/core";
import {
  ActionControlDefinition,
  CompoundField,
  ControlDefinition,
  ControlDefinitionType,
  CreateDataProps,
  defaultDataProps,
  FieldOption,
  FieldType,
  isCompoundField,
  SchemaField,
} from "@react-typed-forms/schemas";
import {
  ControlDefinitionForm,
  defaultSchemaFieldForm,
  SchemaFieldForm,
} from "./schemaSchemas";
import { ReactElement, useCallback } from "react";

export type ControlForm = Control<ControlDefinitionForm>;

export interface ControlDragState {
  draggedFrom?: [Control<any>, number];
  targetIndex: number;
  draggedControl: ControlForm;
  targetParent: ControlForm;
  dragFields?: Control<SchemaFieldForm[]>;
}

export interface DragData {
  overlay: (dd: DragData) => ReactElement;
}

export interface DropData {
  success: (drag: DragData, drop: DropData) => void;
}

export interface ControlDropData extends DropData {
  parent?: ControlForm;
  dropIndex: number;
}

export const NonExistentField = newControl<SchemaFieldForm>(
  defaultSchemaFieldForm,
);

enum SchemaOptionTag {
  SchemaField = "_SchemaField",
  NestedSchemaField = "_NestedSchemaField",
  ValuesOf = "_ValuesOf:",
  TableList = "_TableList",
  HtmlEditor = "_HtmlEditor",
}

function isSchemaOptionTag(x: string): x is SchemaOptionTag {
  return (
    x.startsWith(SchemaOptionTag.ValuesOf) ||
    x === SchemaOptionTag.SchemaField ||
    x === SchemaOptionTag.NestedSchemaField ||
    x === SchemaOptionTag.TableList
  );
}

export function useFieldLookup(
  fields: Control<SchemaFieldForm[] | undefined>,
  field: string | undefined | null,
): Control<SchemaFieldForm> {
  return (
    fields.elements?.find((x) => x.fields.field.value === field) ??
    NonExistentField
  );
}

export function controlDropData(
  parent: ControlForm | undefined,
  dropIndex: number,
  dropSuccess: (drag: DragData, drop: DropData) => void,
): ControlDropData {
  return {
    dropIndex,
    parent,
    success: dropSuccess,
  };
}

export interface InternalHooksContext {
  makeOnClick?: (action: ActionControlDefinition) => () => void;
  tableList?: Control<FieldOption[] | undefined>;
  tableFields?: Control<SchemaFieldForm[]>;
}

export function useEditorDataHook(
  fieldList: SchemaField[],
): (cd: ControlDefinition) => CreateDataProps {
  const createCB: CreateDataProps = useCallback(
    (definition, sf, groupContext, control, dataOptions) => {
      const defaultProps = defaultDataProps(
        definition,
        sf,
        groupContext,
        control,
        dataOptions,
      );
      const otherField = sf.tags?.find(isSchemaOptionTag);

      if (otherField) {
        const [newOptions, newField] = otherFieldOptions(otherField);
        return { ...defaultProps, field: newField, options: newOptions };
      }
      return defaultProps;

      function otherFieldOptions(
        ot: SchemaOptionTag,
      ): [FieldOption[] | undefined, SchemaField] {
        switch (ot) {
          case SchemaOptionTag.SchemaField:
            return [fieldList.map(schemaFieldOption), sf];
          case SchemaOptionTag.NestedSchemaField:
            return [
              fieldList.filter(isCompoundField).map(schemaFieldOption),
              sf,
            ];
          // case SchemaOptionTag.TableList:
          //   return [context?.tableList?.value ?? [], sf];

          default:
            const otherField = ot.substring(SchemaOptionTag.ValuesOf.length);
            const otherFieldName =
              groupContext.groupControl.fields[otherField].value;
            const fieldInSchema = fieldList.find(
              (x) => x.field === otherFieldName,
            );
            const opts = fieldInSchema?.options;
            return [
              opts && opts.length > 0 ? opts : undefined,
              fieldInSchema ? { ...sf, type: fieldInSchema.type } : sf,
            ];
        }
      }
    },
    [fieldList],
  );
  return useCallback(() => createCB, []);
}

// export function makeEditorFormHooks(
//   fields: Control<SchemaFieldForm[]>,
//   editHooks: FormEditHooks,
//   context?: InternalHooksContext,
// ): FormEditHooks {
//   return {
//     ...editHooks,
//     useGroupProperties(
//       formState: FormEditState,
//       definition: GroupedControlsDefinition,
//     ): GroupRendererProps {
//       const nestedField = useFieldLookup(fields, definition.compoundField);
//       let newFS = formState;
//       if (nestedField !== NonExistentField) {
//         newFS = {
//           ...formState,
//           hooks: makeEditorFormHooks(
//             nestedField.fields.children,
//             editHooks,
//             context,
//           ),
//         };
//       }
//       return editHooks.useGroupProperties(newFS, definition);
//     },
//     useDataProperties: (fs, c, sf) => {
//       const control = fs.data.fields[sf.field];
//       const visible = useIsControlVisible(c, fs, editHooks.schemaHooks);
//       const fieldList = fields.value;
//       const otherField = sf.tags?.find(isSchemaOptionTag);
//       const [options, field] = otherField
//         ? otherFieldOptions(otherField)
//         : [getOptionsForScalarField(sf), sf];
//
//       const customRender =
//         visible.value && fieldHasTag(sf, "_DefaultValue")
//           ? (p: DataRendererProps) => (
//               <RenderDefaultValueControls
//                 editHooks={editHooks}
//                 fields={fields}
//                 tableFields={context?.tableFields}
//                 {...p}
//               />
//             )
//           : undefined;
//       return {
//         options,
//         definition: c,
//         field,
//         formState: fs,
//         hideTitle: !!c.hideTitle,
//         renderOptions: c.renderOptions ?? { type: DataRenderType.Standard },
//         control,
//         defaultValue: sf.defaultValue,
//         required: c.required ?? false,
//         visible,
//         customRender,
//         readonly: c.readonly ?? false,
//       } satisfies DataRendererProps;
//
//       function otherFieldOptions(
//         ot: SchemaOptionTag,
//       ): [FieldOptionForm[] | undefined, SchemaField] {
//         switch (ot) {
//           case SchemaOptionTag.SchemaField:
//             return [fieldList.map(schemaFieldOption), sf];
//           case SchemaOptionTag.NestedSchemaField:
//             return [
//               fieldList.filter(isCompoundField).map(schemaFieldOption),
//               sf,
//             ];
//           case SchemaOptionTag.TableList:
//             return [context?.tableList?.value ?? [], sf];
//
//           default:
//             const otherField = ot.substring(SchemaOptionTag.ValuesOf.length);
//             const otherFieldName = fs.data.fields[otherField].value;
//             const fieldInSchema =
//               fields.current.elements.find(
//                 (x) => x.fields.field.value === otherFieldName,
//               ) ?? NonExistentField;
//             const opts = fieldInSchema.fields.options.value;
//             return [
//               opts && opts.length > 0 ? opts : undefined,
//               { ...sf, type: fieldInSchema.fields.type.value },
//             ];
//         }
//       }
//     },
//     useActionProperties(fs, def): ActionRendererProps {
//       const visible = useIsControlVisible(def, fs, editHooks.schemaHooks);
//       return {
//         visible,
//         definition: def,
//         onClick: context?.makeOnClick ? context.makeOnClick(def) : () => {},
//       };
//     },
//   };
// }
//
// function RenderDefaultValueControls({
//   editHooks,
//   fields,
//   tableFields,
//   control,
//   formState: { renderer },
// }: {
//   fields: Control<SchemaFieldForm[]>;
//   tableFields?: Control<SchemaFieldForm[]>;
//   editHooks: FormEditHooks;
// } & DataRendererProps) {
//   const currentFields = fields.value;
//   const currentValue = control.value;
//   useEffect(() => {
//     if (currentValue == null) {
//       control.setValue(defaultValueForFields(currentFields));
//     }
//   }, [currentValue == null]);
//   const internalFields = fields.value;
//   const groupControl: GroupedControlsDefinition = useMemo(
//     () => ({
//       ...defaultControlDefinitionForm,
//       children: internalFields.map(defaultControlForField),
//       compoundField: undefined,
//       groupOptions: { type: GroupRenderType.Grid, hideTitle: true, columns: 2 },
//       type: ControlDefinitionType.Group,
//       title: "",
//     }),
//     [internalFields],
//   );
//   if (!currentValue) {
//     return <></>;
//   }
//   return renderControl(
//     groupControl,
//     control,
//     {
//       fields: currentFields,
//       renderer,
//       hooks: makeEditorFormHooks(
//         tableFields ?? newControl<SchemaFieldForm[]>([]),
//         editHooks,
//       ),
//     },
//     "nested",
//   );
// }

function schemaFieldOption(c: SchemaField): FieldOption {
  return { name: c.field, value: c.field };
}

interface CustomRenderOptions {
  value: string;
  name: string;
  fields: SchemaField[];
}

export function addCustomRenderOptions(
  controlFields: SchemaField[],
  customRenderOptions: CustomRenderOptions[],
): SchemaField[] {
  return controlFields.map((x) =>
    x.field === "renderOptions" && isCompoundField(x) ? addRenderOptions(x) : x,
  );

  function addRenderOptions(roField: CompoundField): CompoundField {
    const children = roField.children;
    return {
      ...roField,
      children: [
        ...children.map((x) =>
          x.field === "type" ? addRenderOptionType(x) : x,
        ),
        ...customRenderOptions.flatMap((x) => x.fields),
      ],
    };
  }

  function addRenderOptionType(typeField: SchemaField): SchemaField {
    const options = typeField.options ?? [];
    return {
      ...typeField,
      options: [
        ...options,
        ...customRenderOptions.map(({ name, value }) => ({ name, value })),
      ],
    };
  }
}

export function findSchemaFieldListForParents(
  fields: Control<SchemaFieldForm[]>,
  parents: ControlForm[],
): Control<SchemaFieldForm[]> | undefined {
  for (const p of parents) {
    const compoundField = p.fields.compoundField.current.value;
    if (
      p.fields.type.current.value === ControlDefinitionType.Group &&
      compoundField
    ) {
      const nextFields = fields.elements.find(
        (x) => x.fields.field.current.value === compoundField,
      );
      if (!nextFields) return undefined;
      fields = nextFields.fields.children;
    }
  }
  return fields;
}

export function isChildOf<T extends { children: T[] | null }>(
  node: Control<T>,
  child: Control<T>,
): boolean {
  return Boolean(
    node.fields.children.elements?.some(
      (x) => x === child || isChildOf(x, child),
    ),
  );
}

export function isDirectChildOf<T extends { children: T[] }>(
  node: Control<T>,
  child: Control<T>,
): boolean {
  return Boolean(node.fields.children.elements.find((x) => x === child));
}

export function findAllParentsInControls<T extends { children: T[] | null }>(
  node: Control<T>,
  nodes: Control<T[] | null>,
): Control<T>[] {
  return nodes.elements?.flatMap((x) => findAllParents(node, x)) ?? [];
}

export function findAllParents<T extends { children: T[] | null }>(
  node: Control<T>,
  rootNode: Control<T>,
): Control<T>[] {
  if (!isChildOf(rootNode, node)) return [];

  return [
    rootNode,
    ...findAllParentsInControls(node, rootNode.fields.children),
  ];
}

export function controlIsGroupControl(c: Control<ControlDefinitionForm>) {
  return c.fields.type.value === ControlDefinitionType.Group;
}

export function controlIsCompoundField(c: Control<SchemaFieldForm>) {
  return c.fields.type.value === FieldType.Compound;
}
