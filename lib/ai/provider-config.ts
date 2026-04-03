type OpenAICompatibleRuntimeConfig = {
  providerName: string;
  baseURL: string;
  apiKey: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  includeUsage?: boolean;
  supportsStructuredOutputs?: boolean;
};

let cachedConfig: OpenAICompatibleRuntimeConfig | null = null;

function requireNonEmptyEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseOptionalRecord(
  name: string,
  value: string | undefined
): Record<string, string> | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${name} must be a valid JSON object string`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object`);
  }

  const entries = Object.entries(parsed);

  for (const [key, entryValue] of entries) {
    if (typeof entryValue !== "string") {
      throw new Error(`${name}.${key} must be a string value`);
    }
  }

  return Object.fromEntries(entries);
}

function parseOptionalBoolean(
  name: string,
  value: string | undefined
): boolean | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`${name} must be either "true" or "false"`);
}

export function getProviderOptionsKey(providerName: string): string {
  const sanitized = providerName.trim().replace(/[^a-zA-Z0-9]+/g, " ");
  const parts = sanitized
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Provider name must contain at least one alphanumeric character");
  }

  const [first, ...rest] = parts;

  return [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
  ].join("");
}

export function getOpenAICompatibleRuntimeConfig(): OpenAICompatibleRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    providerName: requireNonEmptyEnv("OPENAI_COMPATIBLE_PROVIDER_NAME"),
    baseURL: requireNonEmptyEnv("OPENAI_COMPATIBLE_BASE_URL"),
    apiKey: requireNonEmptyEnv("OPENAI_COMPATIBLE_API_KEY"),
    headers: parseOptionalRecord(
      "OPENAI_COMPATIBLE_HEADERS_JSON",
      process.env.OPENAI_COMPATIBLE_HEADERS_JSON
    ),
    queryParams: parseOptionalRecord(
      "OPENAI_COMPATIBLE_QUERY_PARAMS_JSON",
      process.env.OPENAI_COMPATIBLE_QUERY_PARAMS_JSON
    ),
    includeUsage: parseOptionalBoolean(
      "OPENAI_COMPATIBLE_INCLUDE_USAGE",
      process.env.OPENAI_COMPATIBLE_INCLUDE_USAGE
    ),
    supportsStructuredOutputs: parseOptionalBoolean(
      "OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS",
      process.env.OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS
    ),
  };

  return cachedConfig;
}

export type { OpenAICompatibleRuntimeConfig };
