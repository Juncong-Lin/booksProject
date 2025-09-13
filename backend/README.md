# 📚 Bookstore Backend - Modern Authentication System

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-orange.svg)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-Jest-red.svg)](https://jestjs.io/)

A modern, secure, and scalable backend API for a bookstore application with comprehensive user authentication, profile management, and security features. Built with Node.js, Express, MongoDB, and JWT authentication.

## 🚀 Features

### 🔐 Authentication & Security

- **JWT Authentication** with access and refresh tokens
- **Password Security** with bcrypt hashing and strength validation
- **Rate Limiting** to prevent brute force attacks
- **Input Validation** with express-validator
- **CORS Configuration** for frontend integration
- **Security Headers** with Helmet.js
- **Session Management** with token rotation

### 👤 User Management

- **User Registration** with email validation
- **User Login/Logout** with secure sessions
- **Profile Management** with comprehensive user data
- **Password Management** with secure password changes
- **Address Management** for shipping information

### 🛡️ Security Features

- **Input Sanitization** and validation
- **SQL Injection Protection** with parameterized queries
- **XSS Protection** with security headers
- **CSRF Protection** ready
- **Environment Variables** for secure configuration
- **Error Handling** without information leakage

### 🧪 Testing & Quality

- **Comprehensive Test Suite** with Jest
- **Integration Tests** for frontend compatibility
- **Validation Tests** for all input scenarios
- **API Documentation** with examples
- **Health Check Endpoint** for monitoring

### 🚢 Deployment Ready

- **Docker Containerization** with multi-stage builds
- **Environment Configuration** for all platforms
- **Production Optimization** with compression and logging
- **Database Migration** scripts
- **Deployment Guides** for multiple platforms

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Frontend Integration](#-frontend-integration)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [Architecture](#-architecture)

## 🏃 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**

```bash
git clone <your-repository-url>
cd booksProject/backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Environment setup:**

```bash
cp .env.example .env
```

4. **Configure your `.env` file:**

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
FRONTEND_URL=http://localhost:8080
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Verify installation:**

```bash
curl http://localhost:3000/health
```

The API will be available at `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint                    | Description          | Auth Required |
| ------ | --------------------------- | -------------------- | ------------- |
| POST   | `/api/auth/register`        | Register new user    | ❌            |
| POST   | `/api/auth/login`           | User login           | ❌            |
| GET    | `/api/auth/profile`         | Get user profile     | ✅            |
| PUT    | `/api/auth/profile`         | Update user profile  | ✅            |
| POST   | `/api/auth/change-password` | Change password      | ✅            |
| POST   | `/api/auth/refresh-token`   | Refresh access token | ❌            |
| POST   | `/api/auth/logout`          | User logout          | ✅            |

### Example Usage

**Register a new user:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Get Profile (with token):**

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🌐 Frontend Integration

This backend is designed to work seamlessly with the existing bookstore frontend. The authentication system integrates with the provided HTML pages and JavaScript modules.

### Frontend Authentication Service

```javascript
class AuthService {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = localStorage.getItem("token");
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (data.success) {
      this.setTokens(data.data.token, data.data.refreshToken);
    }
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (data.success) {
      this.setTokens(data.data.token, data.data.refreshToken);
    }
    return data;
  }

  setTokens(token, refreshToken) {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    this.token = token;
  }

  async getProfile() {
    return this.authenticatedRequest("/auth/profile");
  }

  async authenticatedRequest(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      await this.refreshToken();
      // Retry the request with new token
      return this.authenticatedRequest(endpoint, options);
    }

    return response.json();
  }
}
```

### Authentication Pages

The backend integrates with these frontend pages:

- **`signin.html`** - User login interface
- **`signup.html`** - User registration interface
- **`profile.html`** - User profile management

### Integration Steps

1. **Update API Base URL** in your frontend JavaScript:

```javascript
const API_BASE_URL = "http://localhost:3000/api"; // Development
// const API_BASE_URL = 'https://your-backend-domain.com/api'; // Production
```

2. **Configure CORS** in backend for your frontend domain:

```env
FRONTEND_URL=http://localhost:8080  # Your frontend URL
```

3. **Update Authentication Flow** in existing pages to use the new backend endpoints.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test auth.test.js
```

### Test Coverage

The test suite includes:

- **Authentication Tests** - Registration, login, profile management
- **Validation Tests** - Input validation for all endpoints
- **Integration Tests** - Frontend compatibility and CORS
- **Security Tests** - Rate limiting, token validation
- **Error Handling Tests** - Consistent error responses

### Test Structure

```
tests/
├── auth.test.js          # Authentication endpoint tests
├── validation.test.js    # Input validation tests
├── integration.test.js   # Frontend integration tests
└── setup.js             # Test configuration
```

### Sample Test Output

```bash
PASS tests/auth.test.js
PASS tests/validation.test.js
PASS tests/integration.test.js

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.158 s
```

## 🚢 Deployment

### Quick Deployment Options

#### 1. Heroku (Recommended for beginners)

```bash
# Install Heroku CLI and login
heroku create your-bookstore-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
heroku config:set JWT_SECRET="your-production-secret"
git push heroku main
```

#### 2. Railway (Recommended for simplicity)

```bash
# Connect Railway to your GitHub repository
# Set environment variables in Railway dashboard
# Automatic deployment on git push
```

#### 3. Docker (Recommended for production)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t bookstore-backend .
docker run -p 3000:3000 --env-file .env bookstore-backend
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookstore
JWT_SECRET=your-super-secure-production-secret-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-32-chars
FRONTEND_URL=https://yourusername.github.io
BCRYPT_SALT_ROUNDS=12
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🛡️ Security

### Security Features Implemented

- **Password Hashing** with bcrypt (12 salt rounds)
- **JWT Tokens** with expiration and refresh rotation
- **Input Validation** with express-validator
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with origin validation
- **Security Headers** with Helmet.js
- **Environment Variable Protection**
- **Error Message Sanitization**

### Security Best Practices

1. **Environment Variables:** Never commit `.env` files
2. **JWT Secrets:** Use strong, unique secrets (32+ characters)
3. **Database:** Use MongoDB Atlas with authentication
4. **HTTPS:** Always use HTTPS in production
5. **Updates:** Keep dependencies updated regularly

### Security Checklist for Production

- [ ] Strong JWT secrets configured
- [ ] MongoDB Atlas with authentication
- [ ] HTTPS enabled
- [ ] CORS configured for specific origins
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error logging configured
- [ ] Health monitoring setup

## 🏗️ Architecture

### Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   │   └── authController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/         # Database models
│   │   └── User.js
│   ├── routes/         # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── books.js
│   │   └── cart.js
│   └── config/         # Configuration
│       └── database.js
├── tests/              # Test files
├── scripts/            # Utility scripts
├── .env.example        # Environment template
├── server.js          # Application entry point
├── package.json       # Dependencies
├── Dockerfile         # Docker configuration
└── docker-compose.yml # Docker Compose setup
```

### Technology Stack

- **Runtime:** Node.js 16+
- **Framework:** Express.js 4.18+
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with refresh tokens
- **Validation:** express-validator
- **Security:** bcrypt, helmet, cors, rate-limiting
- **Testing:** Jest with supertest
- **Containerization:** Docker with multi-stage builds

### API Flow

```
Frontend Request → CORS Check → Rate Limiting → Input Validation →
Authentication Middleware → Controller Logic → Database Operation →
Response Formatting → Security Headers → Frontend Response
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Run the test suite:** `npm test`
5. **Commit your changes:** `git commit -m 'Add amazing feature'`
6. **Push to the branch:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation for API changes
- Ensure all tests pass
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation** in this README and API_DOCUMENTATION.md
2. **Review the test files** for usage examples
3. **Check the deployment guide** for deployment issues
4. **Open an issue** with detailed information about your problem

## 🎯 Roadmap

### Completed Features ✅

- User authentication with JWT
- Profile management
- Input validation and security
- Comprehensive testing
- Docker containerization
- Production deployment guides

### Upcoming Features 🚀

- Email verification system
- Password reset functionality
- User roles and permissions
- API rate limiting per user
- Admin dashboard endpoints
- Order management integration

---

**Built with ❤️ for the modern web**

This backend provides a solid foundation for any e-commerce or bookstore application requiring secure user authentication and profile management. The modular architecture makes it easy to extend with additional features as your application grows.
├── scripts/ # Utility scripts
├── .env.example # Environment template
├── server.js # Application entry point
├── package.json # Dependencies
├── Dockerfile # Docker configuration
└── docker-compose.yml # Docker Compose setup

````

### Technology Stack

- **Runtime:** Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: helmet, bcryptjs, express-rate-limit
- **Environment**: dotenv

## Quick Start

### Prerequisites

- Node.js 16 or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Navigate to backend directory**:
   ```powershell
   cd backend
````

2. **Install dependencies**:

   ```powershell
   npm install
   ```

3. **Set up environment variables**:

   ```powershell
   copy .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bookstore
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   ```

4. **Start the server**:

   ```powershell
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify installation**:
   Visit `http://localhost:5000/health` to check server status.

## API Endpoints

### Authentication

| Method | Endpoint                       | Description             | Auth Required |
| ------ | ------------------------------ | ----------------------- | ------------- |
| POST   | `/api/v1/auth/signup`          | Register new user       | No            |
| POST   | `/api/v1/auth/signin`          | User login              | No            |
| POST   | `/api/v1/auth/refresh`         | Refresh access token    | Refresh Token |
| POST   | `/api/v1/auth/logout`          | User logout             | Yes           |
| POST   | `/api/v1/auth/logout-all`      | Logout from all devices | Yes           |
| GET    | `/api/v1/auth/me`              | Get current user info   | Yes           |
| GET    | `/api/v1/auth/verify`          | Verify token validity   | Yes           |
| PUT    | `/api/v1/auth/profile`         | Update user profile     | Yes           |
| PUT    | `/api/v1/auth/change-password` | Change password         | Yes           |

### Users

| Method | Endpoint                | Description         | Auth Required |
| ------ | ----------------------- | ------------------- | ------------- |
| GET    | `/api/v1/users/profile` | Get user profile    | Yes           |
| PUT    | `/api/v1/users/profile` | Update user profile | Yes           |
| DELETE | `/api/v1/users/account` | Delete user account | Yes           |

### Books

| Method | Endpoint            | Description     | Auth Required |
| ------ | ------------------- | --------------- | ------------- |
| GET    | `/api/v1/books`     | Get all books   | No            |
| GET    | `/api/v1/books/:id` | Get single book | No            |

### Cart

| Method | Endpoint                      | Description           | Auth Required |
| ------ | ----------------------------- | --------------------- | ------------- |
| GET    | `/api/v1/cart`                | Get user's cart       | Yes           |
| POST   | `/api/v1/cart/add`            | Add item to cart      | Yes           |
| PUT    | `/api/v1/cart/update`         | Update cart item      | Yes           |
| DELETE | `/api/v1/cart/remove/:bookId` | Remove item from cart | Yes           |

### Orders

| Method | Endpoint                | Description      | Auth Required |
| ------ | ----------------------- | ---------------- | ------------- |
| GET    | `/api/v1/orders`        | Get user orders  | Yes           |
| POST   | `/api/v1/orders/create` | Create new order | Yes           |
| GET    | `/api/v1/orders/:id`    | Get single order | Yes           |

## Frontend Integration

### Authentication Setup

1. **Include the auth script** in your HTML:

   ```html
   <script src="scripts/auth/auth.js"></script>
   ```

2. **Authentication service is available globally**:

   ```javascript
   // Sign up a new user
   const response = await authService.signup({
     name: "John Doe",
     email: "john@example.com",
     password: "SecurePass123",
     confirmPassword: "SecurePass123",
   });

   // Sign in user
   const response = await authService.signin({
     email: "john@example.com",
     password: "SecurePass123",
     rememberMe: true,
   });

   // Check if user is authenticated
   if (authService.isAuthenticated()) {
     const user = authService.getCurrentUser();
     console.log("Current user:", user);
   }

   // Sign out
   await authService.signout();
   ```

### Protected Routes

Mark elements that require authentication:

```html
<!-- Show only to authenticated users -->
<div data-auth-required>
  <a href="profile.html">My Profile</a>
</div>

<!-- Show only to guests -->
<div data-guest-only>
  <a href="signin.html">Sign In</a>
</div>
```

### Form Integration

The auth service automatically updates the UI and manages authentication state. Use the provided validation utilities:

```javascript
// Validate email
if (!ValidationUtils.validateEmail(email)) {
  UIHelpers.showFieldError("email", "Invalid email address");
}

// Check password strength
const { strength, isValid } = ValidationUtils.validatePassword(password);
```

## Database Setup

### Local MongoDB

1. **Install MongoDB** locally or use Docker:

   ```powershell
   # Using Docker
   docker run --name mongodb -p 27017:27017 -d mongo:latest
   ```

2. **Update connection string** in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/bookstore
   ```

### MongoDB Atlas (Cloud)

1. **Create account** at [MongoDB Atlas](https://www.mongodb.com/atlas)

2. **Create cluster** and get connection string

3. **Update `.env`**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookstore
   ```

## Security Configuration

### JWT Secrets

Generate secure secrets for production:

```powershell
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Environment Variables

**Required variables**:

- `JWT_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `MONGODB_URI`: Database connection string

**Optional variables**:

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

## Deployment

### Development

```powershell
# Install dependencies
npm install

# Start development server with auto-restart
npm run dev
```

### Production

```powershell
# Set environment
$env:NODE_ENV="production"

# Install only production dependencies
npm ci --only=production

# Start server
npm start
```

### Docker Deployment

Create `Dockerfile` in backend directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["npm", "start"]
```

Build and run:

```powershell
docker build -t bookstore-backend .
docker run -p 5000:5000 --env-file .env bookstore-backend
```

### Cloud Deployment

#### Heroku

1. **Install Heroku CLI**
2. **Create app**:
   ```powershell
   heroku create your-app-name
   ```
3. **Set environment variables**:
   ```powershell
   heroku config:set JWT_SECRET=your-secret
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```
4. **Deploy**:
   ```powershell
   git push heroku main
   ```

#### Railway

1. **Connect GitHub repository**
2. **Set environment variables** in dashboard
3. **Deploy automatically** on push

#### DigitalOcean App Platform

1. **Create app** from GitHub
2. **Configure environment** variables
3. **Deploy**

## Testing

### Manual Testing

Use the health endpoint to verify server status:

```powershell
curl http://localhost:5000/health
```

Test authentication endpoints:

```powershell
# Register user
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!","confirmPassword":"Test123!"}'

# Sign in user
curl -X POST http://localhost:5000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Frontend Testing

1. **Start backend server**: `npm run dev`
2. **Open frontend**: Navigate to your HTML files
3. **Test authentication flow**:
   - Visit `signup.html`
   - Create a test account
   - Sign in with credentials
   - Access protected pages

## Troubleshooting

### Common Issues

**Connection refused**:

- Check if MongoDB is running
- Verify connection string in `.env`

**JWT errors**:

- Ensure JWT secrets are set
- Check token expiration settings

**CORS errors**:

- Verify frontend URL is in CORS whitelist
- Check credentials are included in requests

**Validation errors**:

- Check input format matches requirements
- Verify all required fields are provided

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

### Port Conflicts

Change the port if 5000 is in use:

```env
PORT=3001
```

## Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Make changes**
4. **Add tests**
5. **Submit pull request**

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Create GitHub issue
- Check documentation
- Review troubleshooting section
