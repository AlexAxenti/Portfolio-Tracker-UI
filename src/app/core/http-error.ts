import { HttpErrorResponse } from '@angular/common/http';

export function toReadableHttpError(error: unknown, fallbackMessage: string): Error {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error : new Error(fallbackMessage);
  }

  if (error.status === 0) {
    return new Error('Could not connect to the portfolio API. Check that the backend is running.');
  }

  const backendMessage = getBackendMessage(error.error);

  if (backendMessage) {
    return new Error(backendMessage);
  }

  if (error.status === 404) {
    return new Error('The requested portfolio record could not be found.');
  }

  return new Error(`${fallbackMessage} (${error.status} ${error.statusText})`);
}

function getBackendMessage(body: unknown): string | undefined {
  if (!body) {
    return undefined;
  }

  if (typeof body === 'string') {
    try {
      return getBackendMessage(JSON.parse(body));
    } catch {
      return body;
    }
  }

  if (typeof body !== 'object') {
    return undefined;
  }

  const errorBody = body as Record<string, unknown>;

  if (typeof errorBody['message'] === 'string') {
    return errorBody['message'];
  }

  if (typeof errorBody['title'] === 'string') {
    return errorBody['title'];
  }

  if (typeof errorBody['detail'] === 'string') {
    return errorBody['detail'];
  }

  return undefined;
}
