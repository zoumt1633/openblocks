import { CompAction, wrapChildAction } from "openblocks-core";
import { CompParams, MultiBaseComp } from "openblocks-core";
import { CodeNode, fromRecord, Node, withFunction } from "openblocks-core";
import { getDynamicStringSegments } from "openblocks-core";
import { ReactNode } from "react";
import { lastValueIfEqual } from "util/objectUtils";
import {
  ArrayStringControl,
  codeControl,
  CodeControlType,
  JSONValueControl,
  NumberControl,
  StringControl,
} from "./codeControl";
import { ControlParams } from "./controlParams";
import _ from "lodash";
import { millisecondsControl, MillisecondsControlProps } from "./millisecondControl";

/**
 * Used in query to provide data to the server.
 *
 * The inside is a CodeControl, but the view returns a key-value pair, representing the template's key and the value after eval.
 * For example user input: xx{{1+2}}sd{{-1}}
 * return value: {
 *    "1+2": 3,
 *    "-1": {},
 *    "select1.value": "test",
 * }
 */
const __PARAMS_CONTROL_FIELD_NAME = "__PARAMS_CONTROL_FIELD_NAME";

function toParamsControl<T extends CodeControlType>(Control: T) {
  return class ParamsControl extends MultiBaseComp<{
    text: InstanceType<T>;
  }> {
    private readonly paramValues: Record<string, Function> = {};

    parseChildrenFromValue(params: CompParams<string>) {
      const dispatchChild = (action: CompAction): void => {
        params.dispatch && params.dispatch(wrapChildAction("text", action));
      };
      return {
        text: new Control({
          dispatch: dispatchChild,
          value: params.value,
        }) as InstanceType<T>,
      };
    }

    getView() {
      return this.paramValues;
    }

    getPropertyView(): ReactNode {
      return this.children.text.getPropertyView();
    }

    propertyView(params: ControlParams): ReactNode {
      return this.children.text.propertyView(params);
    }

    override extraNode() {
      const segs: Record<string, Node<any>> = {};
      getDynamicStringSegments(this.children.text.unevaledValue)
        .filter((x) => {
          return x.startsWith("{{") && x.endsWith("}}");
        })
        .forEach((x) => {
          const key = x.slice(2, -2); // {{-1}} => -1
          segs[key] = withFunction(
            new CodeNode(`return (${key});`, {
              codeType: "Function",
            }),
            (nodeValue) => nodeValue.value
          );
        });
      return {
        node: {
          [__PARAMS_CONTROL_FIELD_NAME]: lastValueIfEqual(
            this,
            "params_control_cache",
            [this.children.text.unevaledValue, fromRecord(segs)],
            (a, b) => {
              return a[0] === b[0];
            }
          )[1] as Node<any>,
        },
        updateNodeFields: (value: any) => {
          return { paramValues: value[__PARAMS_CONTROL_FIELD_NAME] };
        },
      };
    }

    toJsonValue() {
      return this.children.text.toJsonValue();
    }
  };
}

export type ParamsControlType = ReturnType<typeof toParamsControl>;

export const ParamsStringControl = toParamsControl(StringControl);
export const ParamsNumberControl = toParamsControl(NumberControl);
export const ParamsArrayStringControl = toParamsControl(ArrayStringControl);
export const ParamsPositiveNumberControl = toParamsControl(
  codeControl((value: any) => {
    if (typeof value === "number") {
      return value >= 0 ? value : 0;
    }
    const result = Number(value);
    if (!_.isNaN(result)) {
      return result >= 0 ? result : 0;
    }
    return 0;
  })
);

export const ParamsJsonControl = toParamsControl(JSONValueControl);
export const paramsMillisecondsControl = (props: MillisecondsControlProps) =>
  toParamsControl(millisecondsControl(props));
