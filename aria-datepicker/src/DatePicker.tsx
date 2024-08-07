import React from "react";
import { useDatePicker } from "react-aria";
import { DatePickerStateOptions, useDatePickerState } from "react-stately";
import { DateField } from "./DateField";
import { Calendar, CalendarClasses } from "./Calendar";
import {
  CalendarDateTime,
  DateValue,
  ZonedDateTime,
} from "@internationalized/date";
import { Button, Dialog, Popover } from "@astroapps/aria-base";
import { DialogClasses, PopoverClasses } from "@astroapps/aria-base";
import { TimeField, TimeFieldProps } from "./TimeField";

export interface DatePickerClasses {
  className?: string;
  dialogClasses?: DialogClasses;
  popoverClasses?: PopoverClasses;
  buttonClass?: string;
  calendarClasses?: CalendarClasses;
  iconClass?: string;
  containerClass?: string;
}

export const DefaultDatePickerClasses = {
  iconClass: "fa fa-calendar",
};

export interface DatePickerProps<T extends DateValue = DateValue>
  extends DatePickerStateOptions<T>,
    DatePickerClasses {
  portalContainer?: Element;
  designMode?: boolean;
}
export function DatePicker<T extends DateValue>(props: DatePickerProps<T>) {
  const {
    isReadOnly,
    buttonClass,
    calendarClasses,
    popoverClasses,
    dialogClasses,
    iconClass,
    containerClass,
    portalContainer,
    designMode,
  } = {
    ...DefaultDatePickerClasses,
    ...props,
  };
  let state = useDatePickerState(props);
  let ref = React.useRef(null);
  let { groupProps, fieldProps, buttonProps, dialogProps, calendarProps } =
    useDatePicker<T>(props, state, ref);
  return (
    <div
      style={{ display: "inline-flex", flexDirection: "column" }}
      className={containerClass}
    >
      <div {...groupProps} ref={ref} className={props.className}>
        <DateField {...fieldProps} />

        {!isReadOnly && (
          <Button {...(!designMode ? buttonProps : {})} className={buttonClass}>
            <i className={iconClass} />
          </Button>
        )}
      </div>
      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={ref}
          placement="bottom start"
          portalContainer={portalContainer}
          {...popoverClasses}
        >
          <Dialog {...dialogProps} {...dialogClasses}>
            <Calendar {...calendarProps} {...calendarClasses} />
          </Dialog>
        </Popover>
      )}
    </div>
  );
}
