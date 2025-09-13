# Bookstore Backend API Documentation

## Overview

This is a modern Node.js/Express backend API for a bookstore application with comprehensive user authentication, profile management, and security features.

## Features

- **User Authentication**: Registration, login, logout with JWT tokens
- **Profile Management**: User profile creation and updates
- **Security**: Password hashing, rate limiting, input validation, CORS
- **Token Management**: Access tokens and refresh tokens
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Comprehensive input validation with express-validator
- **Testing**: Jest test suite with comprehensive coverage

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:

```bash
cd booksProject/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
FRONTEND_URL=http://localhost:8080
```

5. Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-09-13T10:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Validation Rules:**

- `name`: Required, 2-50 characters, letters and spaces only
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters, must contain uppercase, lowercase, and number
- `confirmPassword`: Must match password

#### Login User

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "lastLogin": "2025-09-13T10:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Get User Profile

```http
GET /auth/profile
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "createdAt": "2025-09-13T10:00:00.000Z",
      "updatedAt": "2025-09-13T10:00:00.000Z"
    }
  }
}
```

#### Update User Profile

```http
PUT /auth/profile
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

#### Change Password

```http
POST /auth/change-password
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmNewPassword": "NewPassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Refresh Token

```http
POST /auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### Logout

```http
POST /auth/logout
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Error Responses

All endpoints return consistent error responses:

**Validation Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

**Authentication Error (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Server Error (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Security Features

### Password Security

- Passwords are hashed using bcrypt with salt rounds
- Minimum password requirements enforced
- Password confirmation validation

### JWT Tokens

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh token rotation for enhanced security
- Secure token validation middleware

### Rate Limiting

- 100 requests per 15-minute window per IP
- Prevents brute force attacks
- Configurable limits

### Input Validation

- All inputs validated using express-validator
- SQL injection prevention
- XSS protection
- Data sanitization

### CORS Configuration

- Configured for frontend integration
- Origin validation
- Credential support

### Security Headers

- Helmet.js for security headers
- Content Security Policy
- XSS protection headers

## Database Schema

### User Model

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

## Frontend Integration

### Authentication Service

The backend is designed to work with the provided frontend authentication service:

```javascript
// Example usage in frontend
const AuthService = {
  async register(userData) {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async login(credentials) {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  async getProfile() {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
```

### CORS Configuration

The backend is configured to accept requests from your frontend origin. Update the `FRONTEND_URL` in your `.env` file to match your frontend URL.

## Deployment

### Environment Variables

Ensure all required environment variables are set in production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookstore
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
FRONTEND_URL=https://yourdomain.github.io
```

### Docker Deployment

Use the provided Docker configuration:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t bookstore-backend .
docker run -p 3000:3000 --env-file .env bookstore-backend
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Update `MONGODB_URI` in your environment variables

## Development

### Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── config/         # Configuration files
├── tests/              # Test files
├── scripts/            # Utility scripts
├── docker-compose.yml  # Docker configuration
├── Dockerfile         # Docker image configuration
├── jest.config.js     # Jest configuration
└── package.json       # Dependencies and scripts
```

### Adding New Features

1. Create the model in `src/models/`
2. Add validation middleware in `src/middleware/validation.js`
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Add tests in `tests/`
6. Update documentation

## Support

For issues or questions, please check the test files in the `tests/` directory for examples of how to use the API endpoints.

## License

MIT License
