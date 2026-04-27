/**
 * Lightweight JWT verification for server-to-server auth.
 * Uses HS256 (HMAC-SHA256) with Node's built-in crypto.
 * No external dependencies.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtClaims {
    user_id: string;
    roles: string[];
    allowed_projects?: string[];
    iat: number;
    exp: number;
}

function base64urlDecode(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
}

function base64urlDecodeBuffer(str: string): Buffer {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
}

/**
 * Check if a token looks like a JWT (3 dot-separated parts, header starts with eyJ)
 */
export function isJwt(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts[0].startsWith('eyJ');
}

/**
 * Verify a JWT token signed with HS256.
 * Returns the decoded claims if valid, or null if invalid.
 */
export function verifyJwt(token: string, secret: string): JwtClaims | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signatureB64] = parts;

        // Decode and verify header
        const header = JSON.parse(base64urlDecode(headerB64));
        if (header.alg !== 'HS256') return null;

        // Compute expected signature
        const signingInput = `${headerB64}.${payloadB64}`;
        const expectedSig = createHmac('sha256', secret)
            .update(signingInput)
            .digest();

        // Decode provided signature
        const providedSig = base64urlDecodeBuffer(signatureB64);

        // Timing-safe comparison
        if (expectedSig.length !== providedSig.length) return null;
        if (!timingSafeEqual(expectedSig, providedSig)) return null;

        // Decode payload
        const payload = JSON.parse(base64urlDecode(payloadB64)) as JwtClaims;

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;

        // Validate required fields
        if (!payload.user_id || !Array.isArray(payload.roles)) return null;

        return payload;
    } catch {
        return null;
    }
}
