export const generateToken = (payload: object, secret: string, expiresIn: string): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from(require('crypto').createHmac('sha256', secret).update(`${header}.${body}`).digest()).toString('base64url');
    return `${header}.${body}.${signature}`;
}