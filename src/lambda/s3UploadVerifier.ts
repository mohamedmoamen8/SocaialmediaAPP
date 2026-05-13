interface IS3EventRecord {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
      size?: number;
      eTag?: string;
    };
  };
}

interface IS3Event {
  Records?: IS3EventRecord[];
}

const apiBaseUrl = process.env.API_BASE_URL;
const verifySecret = process.env.AWS_UPLOAD_VERIFY_SECRET;

export const handler = async (event: IS3Event) => {
  if (!apiBaseUrl || !verifySecret) {
    throw new Error('API_BASE_URL and AWS_UPLOAD_VERIFY_SECRET are required');
  }

  const records = event.Records || [];
  const results = await Promise.all(
    records.map(async (record) => {
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/uploads/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-verify-secret': verifySecret,
        },
        body: JSON.stringify({
          key,
          bucket: record.s3.bucket.name,
          etag: record.s3.object.eTag,
          size: record.s3.object.size,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Upload verification failed for ${key}: ${response.status} ${body}`);
      }

      return {
        key,
        verified: true,
      };
    })
  );

  return {
    verifiedCount: results.length,
    results,
  };
};
