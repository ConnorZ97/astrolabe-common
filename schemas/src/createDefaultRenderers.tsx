import {
  createDefaultDisplayRenderer,
  DefaultDisplayRendererOptions,
} from "./components/DefaultDisplay";
import {
  DefaultLayout,
  DefaultLayoutRendererOptions,
} from "./components/DefaultLayout";
import {
  ActionRendererRegistration,
  AdornmentRendererRegistration,
  createActionRenderer,
  createDataRenderer,
  createLayoutRenderer,
  DataRendererRegistration,
  DefaultRenderers,
  GroupRendererRegistration,
  isAccordionAdornment,
  isIconAdornment,
  LabelRendererRegistration,
} from "./renderers";
import { createDefaultVisibilityRenderer } from "./components/DefaultVisibility";
import React, { CSSProperties, Fragment, ReactElement, ReactNode } from "react";
import { hasOptions, rendererClass } from "./util";
import clsx from "clsx";
import {
  ActionRendererProps,
  appendMarkupAt,
  ControlLayoutProps,
  GroupRendererProps,
  LabelType,
  renderLayoutParts,
  wrapLayout,
} from "./controlRender";
import {
  AdornmentPlacement,
  DataRenderType,
  FieldOption,
  FieldType,
  FlexRenderer,
  GridRenderer,
  isDataGroupRenderer,
  isDisplayOnlyRenderer,
  isFlexRenderer,
  isGridRenderer,
  isTextfieldRenderer,
} from "./types";
import {
  createSelectRenderer,
  SelectRendererOptions,
} from "./components/SelectDataRenderer";
import { DefaultDisplayOnly } from "./components/DefaultDisplayOnly";
import { Control, Fcheckbox } from "@react-typed-forms/core";
import { ControlInput, createInputConversion } from "./components/ControlInput";
import {
  createDefaultArrayRenderer,
  DefaultArrayRendererOptions,
} from "./components/DefaultArrayRenderer";
import {
  CheckRendererOptions,
  createCheckboxRenderer,
  createCheckListRenderer,
  createRadioRenderer,
} from "./components/CheckRenderer";
import { DefaultAccordion } from "./components/DefaultAccordion";

export interface DefaultRendererOptions {
  data?: DefaultDataRendererOptions;
  display?: DefaultDisplayRendererOptions;
  action?: DefaultActionRendererOptions;
  array?: DefaultArrayRendererOptions;
  group?: DefaultGroupRendererOptions;
  label?: DefaultLabelRendererOptions;
  adornment?: DefaultAdornmentRendererOptions;
  layout?: DefaultLayoutRendererOptions;
}

interface StyleProps {
  className?: string;
  style?: CSSProperties;
}

interface DefaultActionRendererOptions {
  className?: string;
  renderContent?: (
    actionText: string,
    actionId: string,
    actionData: any,
  ) => ReactNode;
}

export function createButtonActionRenderer(
  actionId: string | string[] | undefined,
  options: DefaultActionRendererOptions = {},
): ActionRendererRegistration {
  return createActionRenderer(
    actionId,
    ({
      onClick,
      actionText,
      className,
      style,
      actionId,
      actionData,
    }: ActionRendererProps) => {
      return (
        <button
          className={rendererClass(className, options.className)}
          style={style}
          onClick={onClick}
        >
          {options.renderContent?.(actionText, actionId, actionData) ??
            actionText}
        </button>
      );
    },
  );
}

interface DefaultGroupRendererOptions {
  className?: string;
  standardClassName?: string;
  gridStyles?: (columns: GridRenderer) => StyleProps;
  gridClassName?: string;
  defaultGridColumns?: number;
  flexClassName?: string;
  defaultFlexGap?: string;
}

export function createDefaultGroupRenderer(
  options?: DefaultGroupRendererOptions,
): GroupRendererRegistration {
  const {
    className,
    gridStyles = defaultGridStyles,
    defaultGridColumns = 2,
    gridClassName,
    standardClassName,
    flexClassName,
    defaultFlexGap,
  } = options ?? {};

  function defaultGridStyles({
    columns = defaultGridColumns,
  }: GridRenderer): StyleProps {
    return {
      className: gridClassName,
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      },
    };
  }

  function flexStyles(options: FlexRenderer): StyleProps {
    return {
      className: flexClassName,
      style: {
        display: "flex",
        gap: options.gap ? options.gap : defaultFlexGap,
        flexDirection: options.direction
          ? (options.direction as any)
          : undefined,
      },
    };
  }

  function render(props: GroupRendererProps) {
    const { renderChild, renderOptions, childDefinitions } = props;

    const { style, className: gcn } = isGridRenderer(renderOptions)
      ? gridStyles(renderOptions)
      : isFlexRenderer(renderOptions)
        ? flexStyles(renderOptions)
        : ({ className: standardClassName } as StyleProps);

    return (cp: ControlLayoutProps) => {
      return {
        ...cp,
        children: (
          <div
            className={rendererClass(props.className, clsx(className, gcn))}
            style={style}
          >
            {childDefinitions?.map((c, i) => renderChild(i, c))}
          </div>
        ),
      };
    };
  }

  return { type: "group", render };
}

export const DefaultBoolOptions: FieldOption[] = [
  { name: "Yes", value: true },
  { name: "No", value: false },
];

interface DefaultDataRendererOptions {
  inputClass?: string;
  displayOnlyClass?: string;
  selectOptions?: SelectRendererOptions;
  checkboxOptions?: CheckRendererOptions;
  checkOptions?: CheckRendererOptions;
  radioOptions?: CheckRendererOptions;
  checkListOptions?: CheckRendererOptions;
  booleanOptions?: FieldOption[];
  optionRenderer?: DataRendererRegistration;
}

export function createDefaultDataRenderer(
  options: DefaultDataRendererOptions = {},
): DataRendererRegistration {
  const checkboxRenderer = createCheckboxRenderer(
    options.checkOptions ?? options.checkboxOptions,
  );
  const selectRenderer = createSelectRenderer(options.selectOptions);
  const radioRenderer = createRadioRenderer(
    options.radioOptions ?? options.checkOptions,
  );
  const checkListRenderer = createCheckListRenderer(
    options.checkListOptions ?? options.checkOptions,
  );
  const { inputClass, booleanOptions, optionRenderer, displayOnlyClass } = {
    optionRenderer: selectRenderer,
    booleanOptions: DefaultBoolOptions,
    ...options,
  };

  return createDataRenderer((props, renderers) => {
    const fieldType = props.field.type;
    const renderOptions = props.renderOptions;
    let renderType = renderOptions.type;
    if (props.toArrayProps && renderType !== DataRenderType.CheckList) {
      return (p) => ({
        ...p,
        children: renderers.renderArray(props.toArrayProps!()),
      });
    }
    if (fieldType === FieldType.Compound) {
      const groupOptions = (isDataGroupRenderer(renderOptions)
        ? renderOptions.groupOptions
        : undefined) ?? { type: "Standard", hideTitle: true };
      return renderers.renderGroup({ ...props, renderOptions: groupOptions });
    }
    if (fieldType == FieldType.Any) return <>No control for Any</>;
    if (isDisplayOnlyRenderer(renderOptions))
      return (p) => ({
        ...p,
        className: displayOnlyClass,
        children: (
          <DefaultDisplayOnly
            field={props.field}
            schemaInterface={props.dataContext.schemaInterface}
            control={props.control}
            className={props.className}
            style={props.style}
            emptyText={renderOptions.emptyText}
          />
        ),
      });
    const isBool = fieldType === FieldType.Bool;
    if (booleanOptions != null && isBool && props.options == null) {
      return renderers.renderData({ ...props, options: booleanOptions });
    }
    if (renderType === DataRenderType.Standard && hasOptions(props)) {
      return optionRenderer.render(props, renderers);
    }
    switch (renderType) {
      case DataRenderType.CheckList:
        return checkListRenderer.render(props, renderers);
      case DataRenderType.Dropdown:
        return selectRenderer.render(props, renderers);
      case DataRenderType.Radio:
        return radioRenderer.render(props, renderers);
      case DataRenderType.Checkbox:
        return checkboxRenderer.render(props, renderers);
    }
    const placeholder = isTextfieldRenderer(renderOptions)
      ? renderOptions.placeholder
      : undefined;
    return (
      <ControlInput
        className={rendererClass(props.className, inputClass)}
        style={props.style}
        id={props.id}
        readOnly={props.readonly}
        control={props.control}
        placeholder={placeholder ?? undefined}
        convert={createInputConversion(props.field.type)}
      />
    );
  });
}

export interface DefaultAdornmentRendererOptions {
  accordion?: {
    className?: string;
    togglerOpenClass?: string;
    togglerClosedClass?: string;
    renderTitle?: (
      title: string | undefined,
      current: Control<boolean>,
    ) => ReactNode;
    renderToggler?: (current: Control<boolean>) => ReactNode;
  };
}

export function createDefaultAdornmentRenderer(
  options: DefaultAdornmentRendererOptions = {},
): AdornmentRendererRegistration {
  return {
    type: "adornment",
    render: ({ adornment, designMode }) => ({
      apply: (rl) => {
        if (isIconAdornment(adornment)) {
          return appendMarkupAt(
            adornment.placement ?? AdornmentPlacement.ControlStart,
            <i className={adornment.iconClass} />,
          )(rl);
        }
        if (isAccordionAdornment(adornment)) {
          return wrapLayout((x) => (
            <DefaultAccordion
              children={x}
              accordion={adornment}
              contentStyle={rl.style}
              contentClassName={rl.className}
              designMode={designMode}
              {...options.accordion}
            />
          ))(rl);
        }
      },
      priority: 0,
      adornment,
    }),
  };
}

function createDefaultLayoutRenderer(
  options: DefaultLayoutRendererOptions = {},
) {
  return createLayoutRenderer((props, renderers) => {
    const layout = renderLayoutParts(
      {
        ...props,
        className: rendererClass(props.className, options.className),
      },
      renderers,
    );
    return {
      children: layout.wrapLayout(
        <DefaultLayout layout={layout} {...options} />,
      ),
      className: layout.className,
      style: layout.style,
      divRef: (e) =>
        e && props.errorControl
          ? (props.errorControl.meta.scrollElement = e)
          : undefined,
    };
  });
}

interface DefaultLabelRendererOptions {
  className?: string;
  groupLabelClass?: string;
  controlLabelClass?: string;
  requiredElement?: ReactNode;
  labelContainer?: (children: ReactElement) => ReactElement;
}

export function createDefaultLabelRenderer(
  options?: DefaultLabelRendererOptions,
): LabelRendererRegistration {
  const {
    className,
    groupLabelClass,
    controlLabelClass,
    requiredElement,
    labelContainer,
  } = {
    requiredElement: <span> *</span>,
    labelContainer: (c: ReactElement) => c,
    ...options,
  };
  return {
    render: (props, labelStart, labelEnd, renderers) => {
      if (props.type == LabelType.Text) return props.label;
      return labelContainer(
        <>
          <label
            htmlFor={props.forId}
            className={rendererClass(
              props.className,
              clsx(
                className,
                props.type === LabelType.Group && groupLabelClass,
                props.type === LabelType.Control && controlLabelClass,
              ),
            )}
          >
            {labelStart}
            {renderers.renderLabel(
              { label: props.label, type: LabelType.Text },
              undefined,
              undefined,
            )}
            {props.required && requiredElement}
          </label>
          {labelEnd}
        </>,
      );
    },
    type: "label",
  };
}

export function createDefaultRenderers(
  options: DefaultRendererOptions = {},
): DefaultRenderers {
  return {
    data: createDefaultDataRenderer(options.data),
    display: createDefaultDisplayRenderer(options.display),
    action: createButtonActionRenderer(undefined, options.action),
    array: createDefaultArrayRenderer(options.array),
    group: createDefaultGroupRenderer(options.group),
    label: createDefaultLabelRenderer(options.label),
    adornment: createDefaultAdornmentRenderer(options.adornment),
    renderLayout: createDefaultLayoutRenderer(options.layout),
    visibility: createDefaultVisibilityRenderer(),
  };
}
