export class OpenSecretsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenSecretsError';
  }
}

export class RateLimitError extends OpenSecretsError {
  constructor() {
    super('OpenSecrets API daily rate limit reached. Try again tomorrow.');
    this.name = 'RateLimitError';
  }
}

export class ApiError extends OpenSecretsError {
  constructor(
    public readonly status: number,
    statusText: string
  ) {
    super(`OpenSecrets API error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ParseError extends OpenSecretsError {
  constructor(detail: string) {
    super(`Failed to parse OpenSecrets response: ${detail}`);
    this.name = 'ParseError';
  }
}
