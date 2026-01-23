/**
 * @jest-environment node
 */
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn(),
    },
}));

describe('lib/api-response', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('apiSuccess', () => {
        it('should return a success response with default status 200', () => {
            const data = { id: 1 };
            apiSuccess(data, 'Operation successful');

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    success: true,
                    data,
                    message: 'Operation successful',
                },
                { status: 200 }
            );
        });

        it('should allow custom status code', () => {
            apiSuccess({}, 'Created', 201);
            expect(NextResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                { status: 201 }
            );
        });
    });

    describe('apiError', () => {
        it('should return an error response with default status 500', () => {
            apiError('Something went wrong');

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    success: false,
                    error: {
                        message: 'Something went wrong',
                        code: undefined,
                        details: undefined,
                    },
                },
                { status: 500 }
            );
        });

        it('should include code and details if provided', () => {
            const details = { field: 'email' };
            apiError('Validation failed', 400, details, 'VALIDATION_ERROR');

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    success: false,
                    error: {
                        message: 'Validation failed',
                        code: 'VALIDATION_ERROR',
                        details,
                    },
                },
                { status: 400 }
            );
        });
    });
});
