import React, {
  CSSProperties,
  FC,
  Fragment,
  Key,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  addElement,
  Control,
  Fcheckbox,
  newControl,
  removeElement,
  useComponentTracking,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import {
  AdornmentPlacement,
  ControlAdornment,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DisplayData,
  DynamicPropertyType,
  FieldOption,
  GroupRenderOptions,
  isActionControlsDefinition,
  isDataControlDefinition,
  isDisplayControlsDefinition,
  isGroupControlsDefinition,
  LengthValidator,
  RenderOptions,
  SchemaField,
  SchemaInterface,
  ValidatorType,
} from "./types";
import {
  applyLengthRestrictions,
  ControlDataContext,
  elementValueForField,
  fieldDisplayName,
  findField,
  isCompoundField,
  JsonPath,
  useDynamicHooks,
  useUpdatedRef,
} from "./util";
import { dataControl } from "./controlBuilder";
import {
  defaultUseEvalExpressionHook,
  EvalExpressionHook,
  useEvalActionHook,
  useEvalAllowedOptionsHook,
  useEvalDefaultValueHook,
  useEvalDisabledHook,
  useEvalDisplayHook,
  UseEvalExpressionHook,
  useEvalLabelText,
  useEvalReadonlyHook,
  useEvalStyleHook,
  useEvalVisibilityHook,
} from "./hooks";
import { useValidationHook } from "./validators";
import { cc, useCalculatedControl } from "./internal";
import { defaultSchemaInterface } from "./schemaInterface";

export interface FormRenderer {
  renderData: (
    props: DataRendererProps,
  ) => (layout: ControlLayoutProps) => ControlLayoutProps;
  renderGroup: (
    props: GroupRendererProps,
  ) => (layout: ControlLayoutProps) => ControlLayoutProps;
  renderDisplay: (props: DisplayRendererProps) => ReactNode;
  renderAction: (props: ActionRendererProps) => ReactNode;
  renderArray: (props: ArrayRendererProps) => ReactNode;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
  renderLabel: (
    props: LabelRendererProps,
    labelStart: ReactNode,
    labelEnd: ReactNode,
  ) => ReactNode;
  renderLayout: (props: ControlLayoutProps) => RenderedControl;
  renderVisibility: (props: VisibilityRendererProps) => ReactNode;
}

export interface AdornmentProps {
  adornment: ControlAdornment;
}

export const AppendAdornmentPriority = 0;
export const WrapAdornmentPriority = 1000;

export interface AdornmentRenderer {
  apply(children: RenderedLayout): void;
  adornment?: ControlAdornment;
  priority: number;
}

export interface ArrayRendererProps {
  addAction?: ActionRendererProps;
  required: boolean;
  removeAction?: (elemIndex: number) => ActionRendererProps;
  renderElement: (elemIndex: number) => ReactNode;
  arrayControl: Control<any[] | undefined | null>;
  className?: string;
  style?: React.CSSProperties;
  min?: number | null;
  max?: number | null;
}
export interface Visibility {
  visible: boolean;
  showing: boolean;
}

export interface RenderedLayout {
  labelStart?: ReactNode;
  labelEnd?: ReactNode;
  controlStart?: ReactNode;
  controlEnd?: ReactNode;
  label?: ReactNode;
  children?: ReactNode;
  errorControl?: Control<any>;
  className?: string;
  style?: React.CSSProperties;
}

export interface RenderedControl {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  divRef?: (cb: HTMLElement | null) => void;
}

export interface VisibilityRendererProps extends RenderedControl {
  visibility: Control<Visibility | undefined>;
}

export interface ControlLayoutProps {
  label?: LabelRendererProps;
  errorControl?: Control<any>;
  adornments?: AdornmentRenderer[];
  children?: ReactNode;
  processLayout?: (props: ControlLayoutProps) => ControlLayoutProps;
  className?: string | null;
  style?: React.CSSProperties;
}

export enum LabelType {
  Control,
  Group,
}
export interface LabelRendererProps {
  type: LabelType;
  hide?: boolean | null;
  label: ReactNode;
  required?: boolean | null;
  forId?: string;
  className?: string;
}
export interface DisplayRendererProps {
  data: DisplayData;
  display?: Control<string | undefined>;
  dataContext: ControlDataContext;
  className?: string;
  style?: React.CSSProperties;
}

export type ChildVisibilityFunc = (
  child: ControlDefinition,
  context?: ControlDataContext,
) => EvalExpressionHook<boolean>;
export interface ParentRendererProps {
  childDefinitions: ControlDefinition[];
  renderChild: ChildRenderer;
  className?: string;
  style?: React.CSSProperties;
  dataContext: ControlDataContext;
  parentContext: ControlDataContext;
  useChildVisibility: ChildVisibilityFunc;
}

export interface GroupRendererProps extends ParentRendererProps {
  definition: ControlDefinition;
  renderOptions: GroupRenderOptions;
}

export interface DataRendererProps extends ParentRendererProps {
  renderOptions: RenderOptions;
  definition: DataControlDefinition;
  field: SchemaField;
  elementIndex?: number;
  id: string;
  control: Control<any>;
  readonly: boolean;
  required: boolean;
  options: FieldOption[] | undefined | null;
  hidden: boolean;
  toArrayProps?: () => ArrayRendererProps;
}

export interface ActionRendererProps {
  actionId: string;
  actionText: string;
  actionData?: any;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ControlRenderProps {
  control: Control<any>;
  parentPath?: JsonPath[];
}

export interface FormContextOptions {
  readonly?: boolean | null;
  hidden?: boolean | null;
  disabled?: boolean | null;
}

export interface DataControlProps {
  definition: DataControlDefinition;
  field: SchemaField;
  dataContext: ControlDataContext;
  parentContext: ControlDataContext;
  control: Control<any>;
  formOptions: FormContextOptions;
  style?: React.CSSProperties | undefined;
  renderChild: ChildRenderer;
  elementIndex?: number;
  allowedOptions?: Control<any[] | undefined>;
  useChildVisibility: ChildVisibilityFunc;
}

export type CreateDataProps = (
  controlProps: DataControlProps,
) => DataRendererProps;

export interface ControlRenderOptions extends FormContextOptions {
  useDataHook?: (c: ControlDefinition) => CreateDataProps;
  actionOnClick?: (actionId: string, actionData: any) => () => void;
  useEvalExpressionHook?: UseEvalExpressionHook;
  clearHidden?: boolean;
  schemaInterface?: SchemaInterface;
  elementIndex?: number;
}
export function useControlRenderer(
  definition: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
  options: ControlRenderOptions = {},
): FC<ControlRenderProps> {
  const dataProps = options.useDataHook?.(definition) ?? defaultDataProps;
  const elementIndex = options.elementIndex;
  const schemaInterface = options.schemaInterface ?? defaultSchemaInterface;
  const useExpr = options.useEvalExpressionHook ?? defaultUseEvalExpressionHook;

  const schemaField = lookupSchemaField(definition, fields);

  const dynamicHooks = useDynamicHooks({
    defaultValueControl: useEvalDefaultValueHook(
      useExpr,
      definition,
      schemaField,
      elementIndex != null,
    ),
    visibleControl: useEvalVisibilityHook(useExpr, definition, schemaField),
    readonlyControl: useEvalReadonlyHook(useExpr, definition),
    disabledControl: useEvalDisabledHook(useExpr, definition),
    allowedOptions: useEvalAllowedOptionsHook(useExpr, definition),
    labelText: useEvalLabelText(useExpr, definition),
    actionData: useEvalActionHook(useExpr, definition),
    customStyle: useEvalStyleHook(
      useExpr,
      DynamicPropertyType.Style,
      definition,
    ),
    layoutStyle: useEvalStyleHook(
      useExpr,
      DynamicPropertyType.LayoutStyle,
      definition,
    ),
    displayControl: useEvalDisplayHook(useExpr, definition),
  });

  const useValidation = useValidationHook(definition, schemaField);
  const r = useUpdatedRef({
    options,
    definition,
    fields,
    schemaField,
    elementIndex,
  });

  const Component = useCallback(
    ({ control: rootControl, parentPath = [] }: ControlRenderProps) => {
      const stopTracking = useComponentTracking();
      try {
        const {
          definition: c,
          options,
          fields,
          schemaField,
          elementIndex,
        } = r.current;
        const parentDataContext: ControlDataContext = {
          fields,
          schemaInterface,
          data: rootControl,
          path: parentPath,
        };
        const {
          readonlyControl,
          disabledControl,
          visibleControl,
          displayControl,
          layoutStyle,
          labelText,
          customStyle,
          allowedOptions,
          defaultValueControl,
          actionData,
        } = dynamicHooks(parentDataContext);

        const visible = visibleControl.current.value;
        const visibility = useControl<Visibility | undefined>(() =>
          visible != null
            ? {
                visible,
                showing: visible,
              }
            : undefined,
        );
        useControlEffect(
          () => visibleControl.value,
          (visible) => {
            if (visible != null)
              visibility.setValue((ex) => ({
                visible,
                showing: ex ? ex.showing : visible,
              }));
          },
        );

        const [parentControl, control, controlDataContext] = getControlData(
          schemaField,
          parentDataContext,
          elementIndex,
        );
        useControlEffect(
          () => [
            visibility.value,
            defaultValueControl.value,
            control,
            isDataControlDefinition(definition) && definition.dontClearHidden,
            parentControl?.isNull,
            options.hidden,
          ],
          ([vc, dv, cd, dontClear, parentNull, hidden]) => {
            if (vc && cd && vc.visible === vc.showing) {
              if (hidden || !vc.visible) {
                if (options.clearHidden && !dontClear) {
                  cd.value = undefined;
                }
              } else if (cd.value == null) {
                cd.value = dv;
              }
            }
            if (parentNull && parentControl?.isNull) {
              parentControl.value = {};
            }
          },
          true,
        );
        const myOptions = useCalculatedControl<FormContextOptions>(() => ({
          hidden: options.hidden || !visibility.fields?.showing.value,
          readonly: options.readonly || readonlyControl.value,
          disabled: options.disabled || disabledControl.value,
        })).value;
        useValidation(
          control ?? newControl(null),
          !!myOptions.hidden,
          parentDataContext,
          schemaInterface,
        );
        const childOptions: ControlRenderOptions = {
          ...options,
          ...myOptions,
          elementIndex: undefined,
        };

        useEffect(() => {
          if (control && typeof myOptions.disabled === "boolean")
            control.disabled = myOptions.disabled;
        }, [control, myOptions.disabled]);
        if (parentControl?.isNull) return <></>;

        const adornments =
          definition.adornments?.map((x) =>
            renderer.renderAdornment({ adornment: x }),
          ) ?? [];
        const labelAndChildren = renderControlLayout({
          definition: c,
          renderer,
          renderChild: (k, child, options) => {
            const dataContext = options?.dataContext ?? controlDataContext;
            return (
              <ControlRenderer
                key={k}
                control={dataContext.data}
                fields={dataContext.fields}
                definition={child}
                parentPath={dataContext.path}
                renderer={renderer}
                options={
                  options
                    ? { ...childOptions, elementIndex: options?.elementIndex }
                    : childOptions
                }
              />
            );
          },
          createDataProps: dataProps,
          formOptions: myOptions,
          dataContext: controlDataContext,
          parentContext: parentDataContext,
          control: displayControl ?? control,
          elementIndex,
          labelText,
          field: schemaField,
          displayControl,
          style: customStyle.value,
          allowedOptions,
          actionDataControl: actionData,
          actionOnClick: options.actionOnClick,
          useChildVisibility: (childDef, context) => {
            const schemaField = lookupSchemaField(
              childDef,
              (context ?? controlDataContext).fields,
            );
            return useEvalVisibilityHook(useExpr, childDef, schemaField);
          },
        });
        const renderedControl = renderer.renderLayout({
          ...labelAndChildren,
          adornments,
          className: c.layoutClass,
          style: layoutStyle.value,
        });
        return renderer.renderVisibility({ visibility, ...renderedControl });
      } finally {
        stopTracking();
      }
    },
    [r, dataProps, useValidation, renderer, schemaInterface, dynamicHooks],
  );
  (Component as any).displayName = "RenderControl";
  return Component;
}
export function lookupSchemaField(
  c: ControlDefinition,
  fields: SchemaField[],
): SchemaField | undefined {
  const fieldName = isGroupControlsDefinition(c)
    ? c.compoundField
    : isDataControlDefinition(c)
      ? c.field
      : undefined;
  return fieldName ? findField(fields, fieldName) : undefined;
}
export function getControlData(
  schemaField: SchemaField | undefined,
  parentContext: ControlDataContext,
  elementIndex: number | undefined,
): [Control<any> | undefined, Control<any> | undefined, ControlDataContext] {
  const { data, path } = parentContext;
  const parentControl = data.lookupControl(path);
  const childPath = schemaField
    ? elementIndex != null
      ? [...path, schemaField.field, elementIndex]
      : [...path, schemaField.field]
    : path;
  const childControl =
    schemaField && parentControl
      ? parentControl.fields?.[schemaField.field]
      : undefined;
  return [
    parentControl,
    childControl && elementIndex != null
      ? childControl.elements?.[elementIndex]
      : childControl,
    schemaField
      ? {
          ...parentContext,
          path: childPath,
          fields: isCompoundField(schemaField)
            ? schemaField.children
            : parentContext.fields,
        }
      : parentContext,
  ];
}

export function ControlRenderer({
  definition,
  fields,
  renderer,
  options,
  control,
  parentPath,
}: {
  definition: ControlDefinition;
  fields: SchemaField[];
  renderer: FormRenderer;
  options?: ControlRenderOptions;
  control: Control<any>;
  parentPath?: JsonPath[];
}) {
  const Render = useControlRenderer(definition, fields, renderer, options);
  return <Render control={control} parentPath={parentPath} />;
}

export function defaultDataProps({
  definition,
  field,
  control,
  formOptions,
  style,
  allowedOptions,
  ...props
}: DataControlProps): DataRendererProps {
  const lengthVal = definition.validators?.find(
    (x) => x.type === ValidatorType.Length,
  ) as LengthValidator | undefined;
  const className = cc(definition.styleClass);
  const required = !!definition.required;
  const fieldOptions =
    (field.options?.length ?? 0) === 0 ? null : field.options;
  const allowed = allowedOptions?.value ?? [];
  return {
    definition,
    childDefinitions: definition.children ?? [],
    control,
    field,
    id: "c" + control.uniqueId,
    options:
      fieldOptions && allowed.length > 0
        ? fieldOptions.filter((x) => allowed.includes(x.value))
        : fieldOptions,
    readonly: !!formOptions.readonly,
    renderOptions: definition.renderOptions ?? { type: "Standard" },
    required,
    hidden: !!formOptions.hidden,
    className,
    style,
    ...props,
    toArrayProps:
      field.collection && props.elementIndex == null
        ? () =>
            defaultArrayProps(
              control,
              field,
              required,
              style,
              className,
              (elementIndex) =>
                props.renderChild(
                  control.elements?.[elementIndex].uniqueId ?? elementIndex,
                  {
                    type: ControlDefinitionType.Data,
                    field: definition.field,
                    children: definition.children,
                    hideTitle: true,
                  } as DataControlDefinition,
                  { elementIndex, dataContext: props.parentContext },
                ),
              lengthVal?.min,
              lengthVal?.max,
            )
        : undefined,
  };
}

export function defaultArrayProps(
  arrayControl: Control<any[] | undefined | null>,
  field: SchemaField,
  required: boolean,
  style: CSSProperties | undefined,
  className: string | undefined,
  renderElement: (elemIndex: number) => ReactNode,
  min: number | undefined | null,
  max: number | undefined | null,
): ArrayRendererProps {
  const noun = field.displayName ?? field.field;
  return {
    arrayControl,
    required,
    addAction: {
      actionId: "add",
      actionText: "Add " + noun,
      onClick: () => addElement(arrayControl, elementValueForField(field)),
    },
    removeAction: (i: number) => ({
      actionId: "",
      actionText: "Remove",
      onClick: () => removeElement(arrayControl, i),
    }),
    renderElement: (i) => renderElement(i),
    className: cc(className),
    style,
    min,
    max,
  };
}

export interface ChildRendererOptions {
  elementIndex?: number;
  dataContext?: ControlDataContext;
}

export type ChildRenderer = (
  k: Key,
  child: ControlDefinition,
  options?: ChildRendererOptions,
) => ReactNode;

export interface RenderControlProps {
  definition: ControlDefinition;
  renderer: FormRenderer;
  renderChild: ChildRenderer;
  createDataProps: CreateDataProps;
  formOptions: FormContextOptions;
  dataContext: ControlDataContext;
  parentContext: ControlDataContext;
  control?: Control<any>;
  labelText?: Control<string | null | undefined>;
  field?: SchemaField;
  elementIndex?: number;
  displayControl?: Control<string | undefined>;
  style?: React.CSSProperties;
  allowedOptions?: Control<any[] | undefined>;
  actionDataControl?: Control<any | undefined | null>;
  useChildVisibility: ChildVisibilityFunc;
  actionOnClick?: (actionId: string, actionData: any) => () => void;
}
export function renderControlLayout(
  props: RenderControlProps,
): ControlLayoutProps {
  const {
    definition: c,
    renderer,
    renderChild,
    control,
    field,
    dataContext,
    createDataProps: dataProps,
    displayControl,
    style,
    labelText,
    parentContext,
    useChildVisibility,
  } = props;
  if (isDataControlDefinition(c)) {
    return renderData(c);
  }
  if (isGroupControlsDefinition(c)) {
    if (c.compoundField) {
      return renderData(
        dataControl(c.compoundField, c.title, {
          children: c.children,
          hideTitle: c.groupOptions?.hideTitle,
        }),
      );
    }
    return {
      processLayout: renderer.renderGroup({
        childDefinitions: c.children ?? [],
        definition: c,
        parentContext,
        renderChild,
        dataContext,
        renderOptions: c.groupOptions ?? { type: "Standard" },
        className: cc(c.styleClass),
        useChildVisibility,
        style,
      }),
      label: {
        label: labelText?.value ?? c.title,
        className: cc(c.labelClass),
        type: LabelType.Group,
        hide: c.groupOptions?.hideTitle,
      },
    };
  }
  if (isActionControlsDefinition(c)) {
    const actionData = props.actionDataControl?.value ?? c.actionData;
    return {
      children: renderer.renderAction({
        actionText: labelText?.value ?? c.title ?? c.actionId,
        actionId: c.actionId,
        actionData,
        onClick: props.actionOnClick?.(c.actionId, actionData) ?? (() => {}),
        className: cc(c.styleClass),
        style,
      }),
    };
  }
  if (isDisplayControlsDefinition(c)) {
    return {
      children: renderer.renderDisplay({
        data: c.displayData ?? {},
        className: cc(c.styleClass),
        style,
        display: displayControl,
        dataContext,
      }),
    };
  }
  return {};

  function renderData(c: DataControlDefinition) {
    if (!field) return { children: "No schema field for: " + c.field };
    if (!control) return { children: "No control for: " + c.field };
    const rendererProps = dataProps(
      props as RenderControlProps & {
        definition: DataControlDefinition;
        field: SchemaField;
        control: Control<any>;
      },
    );

    const label = !c.hideTitle
      ? controlTitle(labelText?.value ?? c.title, field)
      : undefined;
    return {
      processLayout: renderer.renderData(rendererProps),
      label: {
        type:
          (c.children?.length ?? 0) > 0 ? LabelType.Group : LabelType.Control,
        label,
        forId: rendererProps.id,
        required: c.required,
        hide: c.hideTitle,
        className: cc(c.labelClass),
      },
      errorControl: control,
    };
  }
}

export function appendMarkup(
  k: keyof Omit<RenderedLayout, "errorControl" | "style" | "className">,
  markup: ReactNode,
): (layout: RenderedLayout) => void {
  return (layout) =>
    (layout[k] = (
      <>
        {layout[k]}
        {markup}
      </>
    ));
}

export function wrapMarkup(
  k: keyof Omit<RenderedLayout, "errorControl" | "style" | "className">,
  wrap: (ex: ReactNode) => ReactNode,
): (layout: RenderedLayout) => void {
  return (layout) => (layout[k] = wrap(layout[k]));
}

export function layoutKeyForPlacement(
  pos: AdornmentPlacement,
): keyof Omit<RenderedLayout, "errorControl" | "style" | "className"> {
  switch (pos) {
    case AdornmentPlacement.ControlEnd:
      return "controlEnd";
    case AdornmentPlacement.ControlStart:
      return "controlStart";
    case AdornmentPlacement.LabelStart:
      return "labelStart";
    case AdornmentPlacement.LabelEnd:
      return "labelEnd";
  }
}

export function appendMarkupAt(
  pos: AdornmentPlacement,
  markup: ReactNode,
): (layout: RenderedLayout) => void {
  return appendMarkup(layoutKeyForPlacement(pos), markup);
}

export function wrapMarkupAt(
  pos: AdornmentPlacement,
  wrap: (ex: ReactNode) => ReactNode,
): (layout: RenderedLayout) => void {
  return wrapMarkup(layoutKeyForPlacement(pos), wrap);
}

export function renderLayoutParts(
  props: ControlLayoutProps,
  renderer: FormRenderer,
): RenderedLayout {
  const { className, children, style, errorControl, label, adornments } =
    props.processLayout?.(props) ?? props;
  const layout: RenderedLayout = {
    children,
    errorControl,
    style,
    className: cc(className),
  };
  (adornments ?? [])
    .sort((a, b) => a.priority - b.priority)
    .forEach((x) => x.apply(layout));
  layout.label =
    label && !label.hide
      ? renderer.renderLabel(label, layout.labelStart, layout.labelEnd)
      : undefined;
  return layout;
}

export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}

export function applyArrayLengthRestrictions(
  {
    arrayControl,
    min,
    max,
    addAction: aa,
    removeAction: ra,
    required,
  }: Pick<
    ArrayRendererProps,
    "addAction" | "removeAction" | "arrayControl" | "min" | "max" | "required"
  >,
  disable?: boolean,
): Pick<ArrayRendererProps, "addAction" | "removeAction"> & {
  addDisabled: boolean;
  removeDisabled: boolean;
} {
  const [removeAllowed, addAllowed] = applyLengthRestrictions(
    arrayControl.elements?.length ?? 0,
    min == null && required ? 1 : min,
    max,
    true,
    true,
  );
  return {
    addAction: disable || addAllowed ? aa : undefined,
    removeAction: disable || removeAllowed ? ra : undefined,
    removeDisabled: !removeAllowed,
    addDisabled: !addAllowed,
  };
}
