export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMessages = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  FETCH_FAILED: 'Failed to fetch data. Please try again.',
  CREATE_FAILED: 'Failed to create resource. Please try again.',
  UPDATE_FAILED: 'Failed to update resource. Please try again.',
  DELETE_FAILED: 'Failed to delete resource. Please try again.',
  INVALID_INPUT: 'Invalid input provided. Please check your data.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
};

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(errorMessages.NETWORK_ERROR, 'NETWORK_ERROR');
  }

  if (error instanceof Error) {
    // Parse API errors
    if (error.message.includes('404')) {
      return new AppError(errorMessages.NOT_FOUND, 'NOT_FOUND', 404);
    }
    if (error.message.includes('401')) {
      return new AppError(errorMessages.UNAUTHORIZED, 'UNAUTHORIZED', 401);
    }
    if (error.message.includes('500')) {
      return new AppError(errorMessages.SERVER_ERROR, 'SERVER_ERROR', 500);
    }

    return new AppError(error.message || errorMessages.SERVER_ERROR);
  }

  return new AppError(errorMessages.SERVER_ERROR);
};

export const getErrorMessage = (error: unknown): string => {
  const appError = handleError(error);
  return appError.message;
};