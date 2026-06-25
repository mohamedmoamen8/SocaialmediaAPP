# SocialMediaAPP

## GraphQL and realtime API

The backend now exposes GraphQL at:

```text
POST /graphql
```

Public GraphQL mutations:

- `signup`
- `login`

Protected GraphQL queries and mutations use the same bearer access token as the
REST API:

```http
Authorization: Bearer <accessToken>
```

Core protected GraphQL operations include:

- Queries: `users`, `me`, `posts`, `feed`, `myPosts`, `post`, `dashboardSummary`
- Mutations: `createPost`, `updatePost`, `deletePost`, `likePost`, `reactToPost`,
  `removeReaction`, `addComment`, `updateComment`, `deleteComment`, `sharePost`

Socket.IO is attached to the same HTTP server as Express. Clients connect with:

```ts
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  auth: { token: accessToken },
});
```

Authenticated sockets automatically join the global `feed` room and their own
`user:<userId>` room. A client can subscribe to a focused post room:

```ts
socket.emit('post:join', postId);
socket.emit('post:leave', postId);
```

Realtime social events:

- `post:created`
- `post:updated`
- `post:deleted`
- `post:liked`
- `post:reacted`
- `post:reaction:removed`
- `comment:added`
- `comment:updated`
- `comment:deleted`
- `post:shared`

## S3 image upload flow

The repository does not include a frontend app, but the backend now exposes the
contract the frontend should use for safe direct-to-S3 image uploads.

1. Frontend requests a signed upload URL:

```ts
const presignResponse = await fetch(`${API_URL}/uploads/images/presign`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    purpose: 'profilePicture',
  }),
});

const { data } = await presignResponse.json();
```

2. Frontend uploads the image directly to Amazon S3:

```ts
await fetch(data.uploadUrl, {
  method: data.method,
  headers: data.headers,
  body: file,
});
```

3. AWS S3 triggers `src/lambda/s3UploadVerifier.ts` on object creation. The
Lambda calls `POST /uploads/verify`, and the frontend can poll:

```ts
const statusResponse = await fetch(`${API_URL}/uploads/${data.uploadId}/status`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Required API environment variables:

```env
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_S3_UPLOAD_PREFIX=uploads
AWS_S3_PUBLIC_BASE_URL=
AWS_UPLOAD_VERIFY_SECRET=
```

Required Lambda environment variables:

```env
API_BASE_URL=https://your-api-domain.com
AWS_UPLOAD_VERIFY_SECRET=same-secret-as-api
```
