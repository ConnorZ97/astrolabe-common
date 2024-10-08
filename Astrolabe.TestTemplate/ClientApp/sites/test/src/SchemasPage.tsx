import { newControl, useControl } from "@react-typed-forms/core";
import {
  accordionOptions,
  addMissingControls,
  applyDefaultValues,
  buildSchema,
  checkListOptions,
  cleanDataForSchema,
  compoundField,
  ControlRenderer,
  createDefaultRenderers,
  createFormRenderer,
  dataControl,
  DataRenderType,
  dateField,
  dateTimeField,
  defaultTailwindTheme,
  displayOnlyOptions,
  doubleField,
  FieldType,
  getJsonPath,
  groupedControl,
  htmlDisplayControl,
  intField,
  jsonataOptions,
  jsonPathString,
  lengthValidatorOptions,
  makeSchemaDataNode,
  radioButtonOptions,
  resolveSchemas,
  rootSchemaNode,
  stringField,
  stringOptionsField,
  textDisplayControl,
  textfieldOptions,
  timeField,
  visitControlData,
  visitControlDataArray,
  withScalarOptions,
} from "@react-typed-forms/schemas";
import React from "react";
import { applyEditorExtensions } from "@astroapps/schemas-editor";
import { DataGridExtension } from "@astroapps/schemas-datagrid";

enum Choice {
  Cool = "Cool",
  Uncool = "Uncool",
}

interface ChildData {
  choice?: Choice | null;
  another: number;
}
interface AllControls {
  type: string;
  text: string;
  double: number;
  int: number;
  compound: ChildData;
  compoundArray: ChildData[];
}

const CompoundSchema = buildSchema<ChildData>({
  choice: withScalarOptions(
    {
      defaultValue: Choice.Cool,
      required: true,
      tags: ["_ControlGroup:Secondary"],
    },
    stringOptionsField(
      "Choice",
      { name: "This is cool", value: Choice.Cool },
      { name: "So uncool", value: Choice.Uncool },
    ),
  ),
  another: intField("Int"),
});

const { Schema } = resolveSchemas({
  CompoundSchema,
  Schema: buildSchema<AllControls>({
    type: stringField("Type", { isTypeField: true }),
    text: stringField("Text", { defaultValue: "text" }),
    double: doubleField("Double", { defaultValue: 1 }),
    int: intField("Int", { notNullable: true }),
    compound: compoundField("Compound", [], {
      notNullable: true,
      required: true,
      schemaRef: "CompoundSchema",
    }),
    compoundArray: compoundField("Compound Array", [], {
      collection: true,
      notNullable: true,
      schemaRef: "CompoundSchema",
    }),
  }),
});

const control = applyDefaultValues({ compound: { intField: 1 } }, Schema);
const control2 = applyDefaultValues(undefined, Schema);
const cleaned = cleanDataForSchema(control, Schema, true);
const definition = addMissingControls(Schema, [
  dataControl("compound"),
  dataControl("compound", "Secondary"),
]);

const dataForVisit = newControl<AllControls>({
  type: "hai",
  text: "TEXT",
  compound: {
    another: 1,
  },
  int: 56,
  double: 1.5,
  compoundArray: [{ another: 45 }],
});
const visitedData = (() => {
  const str: any[] = [];
  visitControlDataArray(
    definition,
    makeSchemaDataNode(rootSchemaNode(Schema), dataForVisit),
    (d, s) => {
      str.push(jsonPathString(getJsonPath(s)));
      if (s.schema.field.type !== FieldType.Compound)
        str.push(s.control?.value);
      return undefined;
    },
  );
  return str;
})();

export function Schemas() {
  return (
    <div className="container">
      <pre id="control">{JSON.stringify(control)}</pre>
      <pre id="control2">{JSON.stringify(control2)}</pre>
      <pre id="cleaned">{JSON.stringify(cleaned)}</pre>
      <pre id="definition">{JSON.stringify(definition)}</pre>
      <pre id="visitedNode">{JSON.stringify(visitedData)}</pre>
      <pre id="dataForVisit">{JSON.stringify(dataForVisit.value)}</pre>
    </div>
  );
}
