import {
  Control,
  newControl,
  unsafeRestoreControl,
  useControl,
} from "@react-typed-forms/core";
import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { ControlDefinitionForm } from "./schemaSchemas";
import { useDroppable } from "@dnd-kit/core";
import {
  ControlDataContext,
  ControlDefinition,
  defaultDataProps,
  defaultSchemaInterface,
  defaultValueForField,
  DynamicPropertyType,
  elementValueForField,
  fieldPathForDefinition,
  FormRenderer,
  getDisplayOnlyOptions,
  getGroupClassOverrides,
  isControlDisplayOnly,
  isDataControlDefinition,
  isGroupControlsDefinition,
  makeHook,
  makeSchemaDataNode,
  renderControlLayout,
  rendererClass,
  schemaForFieldPath,
  SchemaInterface,
  SchemaNode,
} from "@react-typed-forms/schemas";
import { useScrollIntoView } from "./useScrollIntoView";
import { ControlDragState, controlDropData, DragData, DropData } from "./util";
import { ControlNode } from "./types";

export interface FormControlPreviewProps {
  definition: ControlDefinition;
  parent?: ControlDefinition;
  dropIndex: number;
  noDrop?: boolean;
  parentNode: SchemaNode;
  elementIndex?: number;
  schemaInterface?: SchemaInterface;
  keyPrefix?: string;
  styleClass?: string;
  layoutClass?: string;
  labelClass?: string;
  displayOnly?: boolean;
}

export interface FormControlPreviewContext {
  selected: Control<ControlNode | undefined>;
  treeDrag: Control<ControlDragState | undefined>;
  dropSuccess: (drag: DragData, drop: DropData) => void;
  readonly?: boolean;
  VisibilityIcon: ReactNode;
  hideFields: Control<boolean>;
  renderer: FormRenderer;
}

export interface FormControlPreviewDataProps extends FormControlPreviewProps {
  isSelected: boolean;
  isOver: boolean;
}

const defaultLayoutChange = "position";

const PreviewContext = createContext<FormControlPreviewContext | undefined>(
  undefined,
);
export const PreviewContextProvider = PreviewContext.Provider;

function usePreviewContext() {
  const pc = useContext(PreviewContext);
  if (!pc) throw "Must supply a PreviewContextProvider";
  return pc;
}

export function FormControlPreview(props: FormControlPreviewProps) {
  const {
    definition,
    parent,
    elementIndex,
    parentNode,
    dropIndex,
    noDrop,
    keyPrefix,
    schemaInterface = defaultSchemaInterface,
    styleClass,
    labelClass,
    layoutClass,
    displayOnly: dOnly,
  } = props;
  const { selected, dropSuccess, renderer, hideFields } = usePreviewContext();
  const item = unsafeRestoreControl(definition) as
    | Control<ControlDefinitionForm>
    | undefined;
  const displayOnly = dOnly || isControlDisplayOnly(definition);

  const isSelected = !!item && selected.value?.control === item;
  const scrollRef = useScrollIntoView(isSelected);
  const { setNodeRef, isOver } = useDroppable({
    id: item?.uniqueId ?? 0,
    disabled: Boolean(noDrop),
    data: controlDropData(
      parent ? unsafeRestoreControl(parent)?.as() : undefined,
      dropIndex,
      dropSuccess,
    ),
  });
  const groupControl = useControl({});

  const path = fieldPathForDefinition(definition);

  const childNode =
    path && elementIndex == null ? schemaForFieldPath(path, parentNode) : null;
  const dataDefinition = isDataControlDefinition(definition)
    ? definition
    : undefined;
  const isRequired = !!dataDefinition?.required;
  const displayOptions = getDisplayOnlyOptions(definition);
  const field = childNode?.field;
  const sampleData = useMemo(
    () =>
      displayOptions
        ? (displayOptions.sampleText ?? "Sample Data")
        : field &&
          (elementIndex == null
            ? field.collection
              ? [undefined]
              : defaultValueForField(field, isRequired)
            : elementValueForField(field)),
    [displayOptions?.sampleText, field, isRequired, elementIndex],
  );
  const control = useMemo(() => newControl(sampleData), [sampleData]);

  const parentDataNode = makeSchemaDataNode(parentNode, groupControl);
  const dataNode = childNode
    ? makeSchemaDataNode(childNode, control, parentDataNode, elementIndex)
    : undefined;
  const dataContext = {
    schemaInterface,
    dataNode: dataNode ?? parentDataNode,
    parentNode: parentDataNode,
    formData: {},
  } satisfies ControlDataContext;
  const adornments =
    definition.adornments?.map((x) =>
      renderer.renderAdornment({
        adornment: x,
        designMode: true,
        dataContext,
      }),
    ) ?? [];

  const groupClasses = getGroupClassOverrides(definition);

  const layout = renderControlLayout({
    definition,
    renderer,
    elementIndex,
    renderChild: (k, def, c) => {
      return (
        <FormControlPreview
          key={unsafeRestoreControl(def)?.uniqueId ?? k}
          definition={def}
          parent={definition}
          dropIndex={0}
          {...groupClasses}
          {...c}
          parentNode={c?.parentDataNode?.schema ?? childNode ?? parentNode}
          keyPrefix={keyPrefix}
          schemaInterface={schemaInterface}
          displayOnly={c?.displayOnly || displayOnly}
        />
      );
    },
    labelClass,
    styleClass,
    createDataProps: defaultDataProps,
    formOptions: { readonly: dataDefinition?.readonly, displayOnly },
    dataContext,
    control,
    schemaInterface,
    useEvalExpression: () => makeHook(() => undefined, undefined),
    useChildVisibility: () => makeHook(() => useControl(true), undefined),
    designMode: true,
  });
  const asSelection = { control: item!, schema: parentNode };
  const mouseCapture: Pick<
    HTMLAttributes<HTMLDivElement>,
    "onClick" | "onClickCapture" | "onMouseDownCapture"
  > = isGroupControlsDefinition(definition) ||
  (isDataControlDefinition(definition) &&
    (definition.children?.length ?? 0) > 0)
    ? {
        onClick: (e) => (selected.value = asSelection),
      }
    : {
        onClickCapture: (e) => {
          e.preventDefault();
          e.stopPropagation();
          selected.value = asSelection;
        },
        onMouseDownCapture: (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
      };
  const {
    style,
    children: child,
    className,
  } = renderer.renderLayout({
    ...layout,
    adornments,
    className: rendererClass(layoutClass, definition.layoutClass),
  });
  return (
    <div
      style={{
        ...style,
        backgroundColor: isSelected ? "rgba(25, 118, 210, 0.08)" : undefined,
        position: "relative",
      }}
      {...mouseCapture}
      className={className!}
      ref={(e) => {
        scrollRef(e);
        setNodeRef(e);
      }}
    >
      {!hideFields.value && (
        <EditorDetails
          control={definition}
          arrayElement={elementIndex != null}
          schemaVisibility={!!field?.onlyForTypes?.length}
        />
      )}

      {child}
    </div>
  );
}
function EditorDetails({
  control,
  schemaVisibility,
  arrayElement,
}: {
  control: ControlDefinition;
  arrayElement: boolean;
  schemaVisibility?: boolean;
}) {
  const { VisibilityIcon } = usePreviewContext();
  const { dynamic } = control;
  const hasVisibilityScripting = dynamic?.some(
    (x) => x.type === DynamicPropertyType.Visible,
  );

  const fieldName = !arrayElement
    ? isDataControlDefinition(control)
      ? control.field
      : isGroupControlsDefinition(control)
        ? control.compoundField
        : null
    : null;

  if (!fieldName && !(hasVisibilityScripting || schemaVisibility)) return <></>;
  return (
    <div
      style={{
        backgroundColor: "white",
        fontSize: "12px",
        position: "absolute",
        top: 0,
        right: 0,
        padding: 2,
        border: "solid 1px black",
      }}
    >
      {fieldName}
      {(hasVisibilityScripting || schemaVisibility) && (
        <span style={{ paddingLeft: 4 }}>{VisibilityIcon}</span>
      )}
    </div>
  );
}
