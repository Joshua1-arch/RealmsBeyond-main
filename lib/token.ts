
import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    [key: string]: any;
}

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

function getRefreshTokenSecret() {
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
    }
    return new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET);
}

export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(getJwtSecret());
}

export async function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getRefreshTokenSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as JWTPayload;
    } catch (error) {
        console.error('[VerifyToken] Verification failed:', error);
        return null;
    }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getRefreshTokenSecret());
        return payload as unknown as JWTPayload;
    } catch (error) {
        return null;
    }
}
