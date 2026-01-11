export class ApiError extends Error {
    constructor(
        public readonly code: string,
        public readonly message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = 'Resource not found') {
        super('NOT_FOUND', message, 404);
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string = 'Invalid request') {
        super('BAD_REQUEST', message, 400);
    }
}