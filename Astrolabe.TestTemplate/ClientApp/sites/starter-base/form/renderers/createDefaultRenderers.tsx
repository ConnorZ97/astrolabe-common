import {
  AdornmentPlacement,
  AdornmentRendererRegistration,
  appendMarkupAt,
  ControlDataContext,
  createActionRenderer,
  createDataRenderer,
  createDefaultArrayDataRenderer,
  createDefaultArrayRenderer,
  createInputConversion,
  createLabelRenderer,
  createLayoutRenderer,
  DataRendererRegistration,
  DataRenderType,
  DefaultAdornmentRendererOptions,
  DefaultBoolOptions,
  DefaultDataRendererOptions,
  DefaultLayout,
  DefaultLayoutRendererOptions,
  DefaultRendererOptions,
  DefaultRenderers,
  FieldType,
  hasOptions,
  isAccordionAdornment,
  isDataGroupRenderer,
  isDisplayOnlyRenderer,
  isIconAdornment,
  isSetFieldAdornment,
  isTextfieldRenderer,
  rendererClass,
  renderLayoutParts,
  schemaDataForFieldRef,
  SetFieldAdornment,
  useDynamicHooks,
  wrapLayout,
} from "@react-typed-forms/schemas";
import { ControlInput } from "./ControlInput";
import { Button } from "react-native";
import { DefaultDisplayOnly } from "./DefaultDisplayOnly";
import { createSelectRenderer } from "./SelectDataRenderer";
import { createDefaultVisibilityRenderer } from "./DefaultVisibility";
import { createDefaultGroupRenderer } from "./DefaultGroupRenderer";
import { createDefaultDisplayRenderer } from "./DefaultDisplay";
import { createCheckboxRenderer, createRadioRenderer } from "./CheckRenderer";
import { ReactNode, useCallback } from "react";
import { useControlEffect } from "@react-typed-forms/core";
import { DefaultAccordion } from "./DefaultAccordion";
import { Text } from "~/components/ui/text";

export function createDefaultRenderers(
  options: DefaultRendererOptions = {},
): DefaultRenderers {
  return {
    data: createDefaultDataRenderer(options.data),
    display: createDefaultDisplayRenderer(options.display),
    label: createLabelRenderer((p) => (
      <Text
        className={rendererClass(
          p.className,
          "flex flex-row items-baseline gap-4 py-4 font-bold",
        )}
      >
        {p.label}
      </Text>
    )),
    group: createDefaultGroupRenderer(options.group),
    visibility: createDefaultVisibilityRenderer(),
    action: createActionRenderer(undefined, (a) => (
      <Button onPress={() => a.onClick()} title={a.actionText} />
    )),
    adornment: createDefaultAdornmentRenderer(options.adornment),
    array: createDefaultArrayRenderer(options.array),
    renderLayout: createDefaultLayoutRenderer(options.layout),
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

export function createDefaultDataRenderer(
  options: DefaultDataRendererOptions = {},
): DataRendererRegistration {
  // const jsonataRenderer = createJsonataRenderer(options.jsonataClass);
  // const nullToggler = createNullToggleRenderer();
  // const multilineRenderer = createMultilineFieldRenderer(options.multilineClass);
  const checkboxRenderer = createCheckboxRenderer(
    options.checkOptions ?? options.checkboxOptions,
  );
  const selectRenderer = createSelectRenderer(options.selectOptions);
  const radioRenderer = createRadioRenderer(
    options.radioOptions ?? options.checkOptions,
  );
  // const checkListRenderer = createCheckListRenderer(
  //   options.checkListOptions ?? options.checkOptions
  // );
  const { inputClass, booleanOptions, optionRenderer, displayOnlyClass } = {
    optionRenderer: selectRenderer,
    booleanOptions: DefaultBoolOptions,
    ...options,
  };
  const arrayRenderer = createDefaultArrayDataRenderer(options.arrayOptions);

  return createDataRenderer((props, renderers) => {
    const { field } = props;
    const fieldType = field.type;
    const renderOptions = props.renderOptions;
    let renderType = renderOptions.type;
    if (
      field.collection &&
      props.elementIndex == null &&
      (renderType == DataRenderType.Standard ||
        renderType == DataRenderType.Array)
    ) {
      return arrayRenderer.render(props, renderers);
    }
    if (fieldType === FieldType.Compound) {
      const groupOptions = (isDataGroupRenderer(renderOptions)
        ? renderOptions.groupOptions
        : undefined) ?? { type: "Standard", hideTitle: true };
      return renderers.renderGroup({ ...props, renderOptions: groupOptions });
    }
    if (fieldType == FieldType.Any) return <Text>No control for Any</Text>;
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
      //   case DataRenderType.NullToggle:
      //     return nullToggler.render(props, renderers);
      //   case DataRenderType.CheckList:
      //     return checkListRenderer.render(props, renderers);
      //   case DataRenderType.Dropdown:
      //     return selectRenderer.render(props, renderers);
      case DataRenderType.Radio:
        return radioRenderer.render(props, renderers);
      case DataRenderType.Checkbox:
        return checkboxRenderer.render(props, renderers);
      //   case DataRenderType.Jsonata:
      //     return jsonataRenderer.render(props, renderers);
    }
    // if (isTextfieldRenderer(renderOptions) && renderOptions.multiline)
    //   return multilineRenderer.render(props, renderers);
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

export function createDefaultAdornmentRenderer(
  options: DefaultAdornmentRendererOptions = {},
): AdornmentRendererRegistration {
  return {
    type: "adornment",
    render: ({ adornment, designMode, dataContext, useExpr }, renderers) => ({
      apply: (rl) => {
        if (isSetFieldAdornment(adornment) && useExpr) {
          const hook = useExpr(adornment.expression, (x) => x);
          const dynamicHooks = useDynamicHooks({ value: hook });
          const SetFieldWrapper = useCallback(setFieldWrapper, [dynamicHooks]);
          return wrapLayout((x) => (
            <SetFieldWrapper
              children={x}
              parentContext={dataContext}
              adornment={adornment}
            />
          ))(rl);

          function setFieldWrapper({
            children,
            adornment,
            parentContext,
          }: {
            children: ReactNode;
            adornment: SetFieldAdornment;
            parentContext: ControlDataContext;
          }) {
            const { value } = dynamicHooks(parentContext);
            const fieldNode = schemaDataForFieldRef(
              adornment.field,
              parentContext.parentNode,
            );
            const otherField = fieldNode.control;
            const always = !adornment.defaultOnly;
            useControlEffect(
              () => [value?.value, otherField?.value == null],
              ([v]) => {
                otherField?.setValue((x) => (always || x == null ? v : x));
              },
              true,
            );
            return children;
          }
        }
        if (isIconAdornment(adornment)) {
          return appendMarkupAt(
            adornment.placement ?? AdornmentPlacement.ControlStart,
            <i className={adornment.iconClass} />,
          )(rl);
        }
        if (isAccordionAdornment(adornment)) {
          return wrapLayout((x) => (
            <DefaultAccordion
              renderers={renderers}
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
