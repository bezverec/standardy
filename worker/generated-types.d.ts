declare module "*.cjs" {
  import type { ValidateFunction } from "ajv";
  const validate: ValidateFunction;
  export default validate;
}
