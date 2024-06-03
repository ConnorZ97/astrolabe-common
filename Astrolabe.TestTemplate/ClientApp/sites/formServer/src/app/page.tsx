"use client";

import {
  applyEditorExtensions,
  BasicFormEditor,
  ControlDefinitionSchema,
} from "@astroapps/schemas-editor";
import { useControl } from "@react-typed-forms/core";
import {
  boolField,
  buildSchema,
  compoundField,
  createDefaultRenderers,
  createDisplayRenderer,
  createFormRenderer,
  defaultTailwindTheme,
  FieldOption,
  intField,
  stringField,
} from "@react-typed-forms/schemas";
import { useQueryControl } from "@astroapps/client/hooks/useQueryControl";
import {
  convertStringParam,
  useSyncParam,
} from "@astroapps/client/hooks/queryParamSync";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Client } from "../client";
import controlsJson from "../ControlDefinition.json";

const CustomControlSchema = applyEditorExtensions({});

const customDisplay = createDisplayRenderer(
  (p) => <div>PATH: {p.dataContext.path.join(",")}</div>,
  { renderType: "Custom" },
);

const StdFormRenderer = createFormRenderer(
  [customDisplay],
  createDefaultRenderers({
    ...defaultTailwindTheme,
  }),
);

interface TestSchema {
  things: {
    thingId: string;
  };
}

const TestSchema = buildSchema<TestSchema>({
  things: compoundField(
    "Things",
    buildSchema<{ thingId: string }>({ thingId: stringField("Thing Id") }),
  ),
});

export default function Editor() {
  const qc = useQueryControl();
  const selectedForm = useControl("Test");
  useSyncParam(
    qc,
    selectedForm,
    "form",
    convertStringParam(
      (x) => x,
      (x) => x,
      "Test",
    ),
  );
  return (
    <DndProvider backend={HTML5Backend}>
      <BasicFormEditor<string>
        formRenderer={StdFormRenderer}
        editorRenderer={StdFormRenderer}
        loadForm={async (c) => {
          return c === "EditorControls"
            ? {
                fields: ControlDefinitionSchema,
                controls: controlsJson,
              }
            : { fields: TestSchema, controls: [] };
        }}
        selectedForm={selectedForm}
        formTypes={[
          ["EditorControls", "EditorControls"],
          ["Test", "Test"],
        ]}
        saveForm={async (controls) => {
          if (selectedForm.value === "EditorControls") {
            await new Client().controlDefinition(controls);
          }
        }}
        previewOptions={{
          actionOnClick: (aid, data) => () => console.log("Clicked", aid, data),
        }}
        controlDefinitionSchemaMap={CustomControlSchema}
        editorControls={controlsJson}
      />
    </DndProvider>
  );
}
