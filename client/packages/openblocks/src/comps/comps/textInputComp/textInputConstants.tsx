import { BoolControl } from "comps/controls/boolControl";
import {
  BoolCodeControl,
  CustomRuleControl,
  NumberControl,
  RegexControl,
  StringControl,
} from "comps/controls/codeControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { LabelControl } from "comps/controls/labelControl";
import { InputLikeStyleType } from "comps/controls/styleControlConstants";
import { Section, sectionNames, ValueFromOption } from "openblocks-design";
import _ from "lodash";
import { css } from "styled-components";
import { EMAIL_PATTERN, URL_PATTERN } from "util/stringUtils";
import { RecordConstructorToComp, RecordConstructorToView } from "openblocks-core";
import { dropdownControl } from "../../controls/dropdownControl";
import { InputEventHandlerControl } from "../../controls/eventHandlerControl";
import { RefControl } from "../../controls/refControl";
import {
  ChildrenTypeToDepsKeys,
  CommonNameConfig,
  depsConfig,
} from "../../generators/withExposing";
import { formDataChildren } from "../formComp/formDataConstants";
import {
  disabledPropertyView,
  maxLengthPropertyView,
  minLengthPropertyView,
  placeholderPropertyView,
  regexPropertyView,
  requiredPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";

export const TextInputValidationOptions = [
  {
    label: "Text",
    value: "Text",
    extra: /.*/,
    help: "",
  },
  {
    label: "Email",
    value: "Email",
    extra: EMAIL_PATTERN,
    help: trans("validationDesc.email"),
  },
  {
    label: "URL",
    value: "URL",
    extra: URL_PATTERN,
    help: trans("validationDesc.url"),
  },
  {
    label: "Regex",
    value: "Regex",
    extra: undefined,
    help: trans("validationDesc.regex"),
  },
] as const;

type ValidationParams = {
  value: { value: string };
  required: boolean;
  minLength: number;
  maxLength: number;
  validationType: ValueFromOption<typeof TextInputValidationOptions>;
  regex: RegExp;
  customRule: string;
};

const valueInfoMap = _.fromPairs(
  TextInputValidationOptions.map((option) => [option.value, option])
);

export const textInputValidate = (
  props: ValidationParams
): {
  validateStatus: "success" | "warning" | "error" | "";
  help?: string;
} => {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }
  const value = props.value.value;
  if (props.required && value.length === 0) {
    return { validateStatus: "error", help: trans("prop.required") };
  }
  if (props.maxLength > 0 && value.length > props.maxLength) {
    return {
      validateStatus: "error",
      help: trans("validationDesc.maxLength", { length: value.length, maxLength: props.maxLength }),
    };
  }
  if (props.minLength > 0 && value.length < props.minLength) {
    return {
      validateStatus: "error",
      help: trans("validationDesc.minLength", { length: value.length, minLength: props.minLength }),
    };
  }
  const optionValue = props.validationType;
  const regex: RegExp = valueInfoMap[optionValue]?.extra ?? props.regex; // pass if empty by default
  if (!regex.test(value)) {
    return { validateStatus: "error", help: valueInfoMap[optionValue].help };
  }
  return { validateStatus: "" };
};

const TextInputInvalidConfig = depsConfig<TextInputComp, ChildrenTypeToDepsKeys<TextInputComp>>({
  name: "invalid",
  desc: trans("export.invalidDesc"),
  depKeys: ["value", "required", "minLength", "maxLength", "validationType", "regex", "customRule"],
  func: (input) =>
    textInputValidate({
      ...input,
      value: { value: input.value },
    }).validateStatus !== "",
});

export const TextInputConfigs = [TextInputInvalidConfig, ...CommonNameConfig];

export const textInputChildren = {
  value: stringExposingStateControl("value"),
  disabled: BoolCodeControl,
  label: LabelControl,
  placeholder: StringControl,
  onEvent: InputEventHandlerControl,
  viewRef: RefControl,
  readOnly: BoolControl,

  // validation
  required: BoolControl,
  minLength: NumberControl,
  maxLength: NumberControl,
  validationType: dropdownControl(TextInputValidationOptions, "Text"),
  regex: RegexControl,
  customRule: CustomRuleControl,

  ...formDataChildren,
};

export const textInputProps = (props: RecordConstructorToView<typeof textInputChildren>) => ({
  ref: props.viewRef,
  disabled: props.disabled,
  readOnly: props.readOnly,
  placeholder: props.placeholder,
  value: props.value.value,
  onChange: (e: any) => {
    props.value.onChange(e.target.value);
    props.onEvent("change");
  },
  onFocus: () => props.onEvent("focus"),
  onBlur: () => props.onEvent("blur"),
  onPressEnter: () => props.onEvent("submit"),
});

type TextInputComp = RecordConstructorToComp<typeof textInputChildren>;

export const TextInputBasicSection = (children: TextInputComp) => (
  <Section name={sectionNames.basic}>
    {children.value.propertyView({ label: trans("prop.defaultValue") })}
    {placeholderPropertyView(children)}
  </Section>
);

export const TextInputInteractionSection = (children: TextInputComp) => (
  <Section name={sectionNames.interaction}>
    {children.onEvent.getPropertyView()}
    {disabledPropertyView(children)}
  </Section>
);

export const TextInputValidationSection = (children: TextInputComp) => (
  <Section name={sectionNames.validation}>
    {requiredPropertyView(children)}
    {children.validationType.propertyView({ label: trans("prop.textType") })}
    {valueInfoMap[children.validationType.getView()]?.extra === undefined &&
      regexPropertyView(children)}
    {minLengthPropertyView(children)}
    {maxLengthPropertyView(children)}
    {children.customRule.propertyView({})}
  </Section>
);

export function getStyle(style: InputLikeStyleType) {
  return css`
    border-radius: ${style.radius};
    // still use antd style when disabled
    &:not(.ant-input-disabled, .ant-input-affix-wrapper-disabled),
    input {
      color: ${style.text};
      background-color: ${style.background};
      border-color: ${style.border};

      &:focus,
      &.ant-input-affix-wrapper-focused {
        border-color: ${style.accent};
      }

      &:hover {
        border-color: ${style.accent};
      }

      &::-webkit-input-placeholder {
        color: ${style.text};
        opacity: 0.4;
      }

      .ant-input-password-icon.anticon {
        opacity: 0.45;
        color: ${style.text};
      }
    }
  `;
}
