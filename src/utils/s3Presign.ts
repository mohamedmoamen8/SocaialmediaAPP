import crypto from 'crypto';

interface IPresignPutObjectInput {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
}

const algorithm = 'AWS4-HMAC-SHA256';
const service = 's3';

const hmac = (key: Buffer | string, data: string): Buffer =>
  crypto.createHmac('sha256', key).update(data, 'utf8').digest();

const hash = (value: string): string =>
  crypto.createHash('sha256').update(value, 'utf8').digest('hex');

const encodeRfc3986 = (value: string): string =>
  encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );

const toAmzDate = (date: Date): string =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, '');

const getSignatureKey = (
  secretAccessKey: string,
  dateStamp: string,
  region: string
): Buffer => {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
};

export const createPresignedPutObjectUrl = ({
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
  key,
  contentType,
  expiresInSeconds,
}: IPresignPutObjectInput): string => {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const encodedKey = key.split('/').map(encodeRfc3986).join('/');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const signedHeaders = 'content-type;host';

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  };

  const canonicalQueryString = Object.entries(queryParams)
    .map(([queryKey, value]) => `${encodeRfc3986(queryKey)}=${encodeRfc3986(value)}`)
    .sort()
    .join('&');

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const canonicalRequest = [
    'PUT',
    `/${encodedKey}`,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region);
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return `https://${host}/${encodedKey}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};

export const getS3ObjectUrl = ({
  bucket,
  region,
  key,
  publicBaseUrl,
}: {
  bucket: string;
  region: string;
  key: string;
  publicBaseUrl?: string;
}): string => {
  const encodedKey = key.split('/').map(encodeRfc3986).join('/');
  if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
};
