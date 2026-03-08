export class FECApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FECApiError';
  }
}

export class RateLimitError extends FECApiError {
  constructor() {
    super('FEC API rate limit reached. Try again later.');
    this.name = 'RateLimitError';
  }
}

export class ApiError extends FECApiError {
  constructor(
    public readonly status: number,
    statusText: string
  ) {
    super(`FEC API error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ParseError extends FECApiError {
  constructor(detail: string) {
    super(`Failed to parse FEC API response: ${detail}`);
    this.name = 'ParseError';
  }
}
