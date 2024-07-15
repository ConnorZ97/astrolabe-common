import {
  ControlDefinition,
  DataControlDefinition,
  DateComparison,
  DateValidator,
  isDataControlDefinition,
  JsonataValidator,
  LengthValidator,
  SchemaField,
  SchemaValidator,
  ValidationMessageType,
  ValidatorType,
} from "./types";
import {
  Control,
  useValidator,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import { useCallback } from "react";
import { ControlDataContext, makeHookDepString, useUpdatedRef } from "./util";
import { useJsonataExpression } from "./hooks";

interface ValidationHookContext {
  hiddenControl: Control<boolean | null | undefined>;
  dataContext: ControlDataContext;
  control: Control<any>;
}

export interface ValidationContext extends ValidationHookContext {
  definition: DataControlDefinition;
  field: SchemaField;
  index: number;
}

export function useMakeValidationHook(
  definition: ControlDefinition,
  field: SchemaField | undefined,
  useValidatorFor: (
    validator: SchemaValidator,
    ctx: ValidationContext,
  ) => void = useDefaultValidator,
): (ctx: ValidationHookContext) => void {
  const dd =
    field && isDataControlDefinition(definition) ? definition : undefined;
  const refData = useUpdatedRef({ dd, field, useValidatorFor });
  const depString = makeHookDepString(dd?.validators ?? [], (x) => x.type);
  return useCallback(
    (ctx) => {
      const { dd, field } = refData.current;
      if (!dd || !field) return;
      const {
        control,
        hiddenControl,
        dataContext: { schemaInterface },
      } = ctx;

      useValueChangeEffect(control, () => control.setError("default", ""));
      useValidator(
        control,
        (v) =>
          !hiddenControl.value &&
          dd.required &&
          schemaInterface.isEmptyValue(field, v)
            ? schemaInterface.validationMessageText(
                field,
                ValidationMessageType.NotEmpty,
                false,
                true,
              )
            : null,
        "required",
        undefined,
        [dd.required],
      );
      dd.validators?.forEach((v, i) =>
        useValidatorFor(v, { ...ctx, index: i, field, definition: dd }),
      );
    },
    [!!dd, depString, useValidatorFor],
  );
}

function useDefaultValidator(
  validator: SchemaValidator,
  ctx: ValidationContext,
) {
  switch (validator.type) {
    case ValidatorType.Length:
      useLengthValidator(validator as LengthValidator, ctx);
      break;
    case ValidatorType.Jsonata:
      useJsonataValidator(validator as JsonataValidator, ctx);
      break;
    case ValidatorType.Date:
      useDateValidator(validator as DateValidator, ctx);
      break;
  }
}

export function useJsonataValidator(
  validator: JsonataValidator,
  ctx: ValidationContext,
) {
  const errorMsg = useJsonataExpression(validator.expression, ctx.dataContext);
  useValidator(
    ctx.control,
    () => (!ctx.hiddenControl.value ? errorMsg.value : null),
    "jsonata" + ctx.index,
  );
}

export function useLengthValidator(
  lv: LengthValidator,
  ctx: ValidationContext,
) {
  const {
    control,
    dataContext: { schemaInterface },
    hiddenControl,
    field,
  } = ctx;
  useValidator(
    control,
    (v) => {
      const len = schemaInterface.controlLength(field, control);
      const hidden = hiddenControl.value;
      if (hidden) {
        return undefined;
      }
      if (lv.min != null && len < lv.min) {
        if (field?.collection) {
          control.setValue((v) =>
            Array.isArray(v)
              ? v.concat(Array.from({ length: lv.min! - v.length }))
              : Array.from({ length: lv.min! }),
          );
        } else {
          return schemaInterface.validationMessageText(
            field,
            ValidationMessageType.MinLength,
            len,
            lv.min,
          );
        }
      } else if (lv.max != null && len > lv.max) {
        return schemaInterface.validationMessageText(
          field,
          ValidationMessageType.MaxLength,
          len,
          lv.max,
        );
      }
      return undefined;
    },
    "length" + ctx.index,
  );
}

export function useDateValidator(dv: DateValidator, ctx: ValidationContext) {
  const {
    control,
    field,
    index,
    dataContext: { schemaInterface },
  } = ctx;
  let comparisonDate: number;
  if (dv.fixedDate) {
    comparisonDate = Date.parse(dv.fixedDate);
  } else {
    const nowDate = new Date();
    comparisonDate = Date.UTC(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
    );
    if (dv.daysFromCurrent) {
      comparisonDate += dv.daysFromCurrent * 86400000;
    }
  }
  useValidator(
    control,
    (v) => {
      if (v) {
        const selDate = schemaInterface.parseToMillis(field, v);
        const notAfter = dv.comparison === DateComparison.NotAfter;
        if (notAfter ? selDate > comparisonDate : selDate < comparisonDate) {
          return `Date must not be ${notAfter ? "after" : "before"} ${new Date(
            comparisonDate,
          ).toDateString()}`;
        }
      }
      return null;
    },
    "date" + index,
  );
}
