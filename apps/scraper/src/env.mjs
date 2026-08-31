import { config } from "dotenv";

export function loadEnvironment(path, processEnv = process.env) {
  config({ path, processEnv, quiet: true });
}
