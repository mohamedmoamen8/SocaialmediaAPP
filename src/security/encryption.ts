import crypto from 'crypto';
import {EncryptionKey} from './../config';
const IV_LENGTH = Number(process.env.IV_LENGTH) || 16; 
const SECRET_KEY = Buffer.from(EncryptionKey as string);

export const encryption = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
    let ciphertext = cipher.update(text, 'utf8', 'hex');
    ciphertext += cipher.final('hex'); 
    return '' + iv.toString('hex') + ':' + ciphertext;
}
export const decryption = (cipherData: string): string => {
    const [iv, ciphertext] = cipherData.split(':')as [string, string];
    const binaryIv = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, binaryIv);
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
};