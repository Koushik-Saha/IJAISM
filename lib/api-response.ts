import { NextResponse } from 'next/server';

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}

/**
 * reliable success response wrapper
 */
export function apiSuccess<T>(data: T, message?: string, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
        },
        { status }
    );
}

/**
 * reliable error response wrapper
 */
export function apiError(
    message: string,
    status: number = 500,
    details?: Record<string, any>,
    code?: string
) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
                code,
                details,
            },
        },
        { status }
    );
}
