export const CONDITION_OPERATORS = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "greater_than", label: "greater than" },
  { value: "greater_or_equal", label: "greater or equal" },
  { value: "less_than", label: "less than" },
  { value: "less_or_equal", label: "less or equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "not contains" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "exists", label: "exists" },
  { value: "not_exists", label: "does not exist" },
] as const;

export type ConditionOperatorValue =
  typeof CONDITION_OPERATORS[number]["value"];
