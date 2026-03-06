import crypto from 'crypto';

type DecisionAction = 'aprobar' | 'rechazar';

interface DecisionPayload {
    cotizacionId: string;
    action: DecisionAction;
    exp: number;
}

function getSecret() {
    const secret = process.env.COTIZACION_LINK_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('Configura COTIZACION_LINK_SECRET o NEXTAUTH_SECRET');
    }
    return secret;
}

function toBase64Url(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function createCotizacionDecisionToken(payload: DecisionPayload) {
    const secret = getSecret();
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload, secret);
    return `${encodedPayload}.${signature}`;
}

export function verifyCotizacionDecisionToken(token: string): DecisionPayload | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
        return null;
    }

    const secret = getSecret();
    const expectedSignature = sign(encodedPayload, secret);
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
        return null;
    }

    if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload)) as DecisionPayload;
        if (!payload?.cotizacionId || !payload?.action || !payload?.exp) {
            return null;
        }
        if (payload.action !== 'aprobar' && payload.action !== 'rechazar') {
            return null;
        }
        if (payload.exp < Date.now()) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}
