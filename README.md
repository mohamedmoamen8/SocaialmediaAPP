# Social Media App

A modern, full-featured social media application built with TypeScript, featuring GraphQL API, real-time Socket.IO updates, and secure S3 image uploads.

## Overview

Social Media App is a comprehensive platform that enables users to connect, share content, and interact in real-time. It combines a robust backend with GraphQL and REST APIs, real-time notifications via Socket.IO, and secure media handling through AWS S3.

## ✨ Features

### Core Social Features
- **User Authentication**: Secure registration and login with JWT tokens
- **User Profiles**: Customizable user profiles with profile pictures
- **Content Sharing**: Create, edit, and delete posts
- **Social Interactions**: Like posts, react with emojis, and comment
- **Share System**: Share posts within the platform
- **Feed**: Personalized feed with real-time updates

### API & Real-time
- **GraphQL API**: Modern GraphQL interface for queries and mutations
- **REST API**: Traditional REST endpoints for flexibility
- **Real-time Updates**: Socket.IO powered instant notifications
- **Room-based Events**: Post-specific and user-specific event subscriptions

### Media Handling
- **Secure S3 Uploads**: Direct-to-S3 image uploads with presigned URLs
- **Lambda Verification**: AWS Lambda for upload verification
- **Profile Pictures**: Support for user profile images

## Tech Stack

- **Language**: TypeScript
- **Backend Framework**: Express.js / Node.js
- **API**: GraphQL + REST
- **Real-time**: Socket.IO
- **Storage**: AWS S3
- **Database**: [Database info to be added]

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- AWS Account (for S3 and Lambda features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mohamedmoamen8/SocialMediaApp.git
cd SocialMediaApp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with required variables (see Environment Variables section below)

5. Start the application:
```bash
npm start
```

## API Documentation

### GraphQL Endpoint

```
POST /graphql
```

#### Public Operations
- `signup` - Register a new user
- `login` - Authenticate and get access token

#### Protected Operations (Require Bearer Token)

**Queries:**
- `users` - List all users
- `me` - Get current user
- `posts` - Get all posts
- `feed` - Get personalized feed
- `myPosts` - Get user's posts
- `post(id)` - Get single post
- `dashboardSummary` - Get dashboard stats

**Mutations:**
- `createPost(content, images)` - Create a new post
- `updatePost(id, content)` - Update a post
- `deletePost(id)` - Delete a post
- `likePost(postId)` - Like a post
- `reactToPost(postId, reaction)` - React with emoji
- `removeReaction(reactionId)` - Remove reaction
- `addComment(postId, content)` - Add comment
- `updateComment(id, content)` - Edit comment
- `deleteComment(id)` - Delete comment
- `sharePost(postId)` - Share a post

### Authentication

Include bearer token in requests:
```http
Authorization: Bearer <accessToken>
```

### Real-time Socket.IO Events

#### Connection
```typescript
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  auth: { token: accessToken },
});
```

#### Automatic Subscriptions
- Global `feed` room
- User-specific `user:<userId>` room

#### Manual Room Management
```typescript
socket.emit('post:join', postId);    // Subscribe to post
socket.emit('post:leave', postId);   // Unsubscribe from post
```

#### Real-time Events
- `post:created` - New post added
- `post:updated` - Post edited
- `post:deleted` - Post removed
- `post:liked` - Post liked
- `post:reacted` - Emoji reaction added
- `post:reaction:removed` - Reaction removed
- `comment:added` - New comment
- `comment:updated` - Comment edited
- `comment:deleted` - Comment removed
- `post:shared` - Post shared

### Image Upload Flow

#### 1. Request Presigned URL
```typescript
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
    purpose: 'profilePicture', // or 'postImage'
  }),
});

const { data } = await presignResponse.json();
```

#### 2. Upload to S3
```typescript
await fetch(data.uploadUrl, {
  method: data.method,
  headers: data.headers,
  body: file,
});
```

#### 3. Verify Upload Status
```typescript
const statusResponse = await fetch(`${API_URL}/uploads/${data.uploadId}/status`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

## Environment Variables

### API Server (.env)

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=your_database_url

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_UPLOAD_PREFIX=uploads
AWS_S3_PUBLIC_BASE_URL=https://your-bucket.s3.amazonaws.com

# Lambda Verification
AWS_UPLOAD_VERIFY_SECRET=your_verification_secret
```

### Lambda Function (src/lambda/s3UploadVerifier.ts)

```env
API_BASE_URL=https://your-api-domain.com
AWS_UPLOAD_VERIFY_SECRET=same-secret-as-api
```

## Project Structure

```
SocialMediaApp/
├── src/
│   ├── api/              # API endpoints
│   ├── graphql/          # GraphQL schema and resolvers
│   ├── services/         # Business logic
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── lambda/           # AWS Lambda functions
│   └── utils/            # Utility functions
├── public/               # Static files
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Deployment

### Deploy to Production

```bash
npm run build
npm start
```

### Deploy Lambda Function

Upload `src/lambda/s3UploadVerifier.ts` to AWS Lambda with the required environment variables.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is currently unlicensed. Please see the LICENSE file for more information.

## Author

**Mohamed Moamen** - [@mohamedmoamen8](https://github.com/mohamedmoamen8)

## Support

If you encounter any issues or have questions, please:

1. Open an issue on the [GitHub Issues](https://github.com/mohamedmoamen8/SocialMediaApp/issues) page
2. Include a clear description and any relevant error messages

---

**Note**: The repository name contains a typo ("SocaialmediaAPP"). Consider renaming it to "SocialMediaApp" for better clarity and professionalism.
