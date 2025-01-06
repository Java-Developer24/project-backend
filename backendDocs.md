# Virtual Number Backend API Documentation

## Overview

The Virtual Number Backend is a Node.js-based REST API service that provides virtual phone number management, OTP verification, and recharge functionality. The system supports multiple service providers and includes features like user authentication, balance management, and transaction tracking.

### Technology Stack
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Google OAuth2.0
- Passport.js

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd virtual-number-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/virtual-number
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
OWNER_WALLET_ADDRESS=your_trx_wallet_address
UPI_ID=your_upi_id
API_KEY=your_api_key
SESSION_SECRET=your_session_secret
```

4. Start the server:
```bash
npm run dev
```

## Codebase Structure

```
virtual-number-backend/
├── controllers/           # Route handlers
├── middleware/           # Custom middleware
├── models/              # Database models
├── routes/              # API routes
├── utils/              # Helper functions
├── app.js              # Application entry point
└── package.json        # Project dependencies
```

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/signup`
- **Description**: Register a new user
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "captcha": "captcha_token"
}
```
- **Response**: 
```json
{
  "message": "Signup successful. Please verify your email to activate your account.",
  "email": "user@example.com",
  "apiKey": "generated_api_key"
}
```

#### Login
- **POST** `/api/auth/login`
- **Description**: Authenticate user
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "captcha": "captcha_token"
}
```
- **Response**:
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "balance": 0,
    "apiKey": "api_key"
  }
}
```

### User Management

#### Get User Balance
- **GET** `/api/user/balance`
- **Query Parameters**: `api_key`
- **Response**:
```json
{
  "balance": "100.00"
}
```

#### Update User Balance (Admin)
- **POST** `/api/user/update-user-balance`
- **Request Body**:
```json
{
  "userId": "user_id",
  "new_balance": 100.00
}
```

### Recharge Operations

#### TRX Recharge
- **GET** `/api/recharge/trx`
- **Query Parameters**: 
  - `userId`
  - `transactionHash`
  - `email`
- **Response**:
```json
{
  "message": "Recharge successful. {amount}₹ Added to Wallet Successfully!"
}
```

#### UPI Recharge
- **POST** `/api/recharge/upi`
- **Request Body**:
```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "transactionId": "transaction_id"
}
```

### Service Management

#### Get Services
- **GET** `/api/service/get-service-data-admin`
- **Description**: Get all services (admin view)
- **Headers**: `Authorization: Bearer {token}`

#### Update Service Maintenance
- **POST** `/api/service/maintainance-server`
- **Request Body**:
```json
{
  "server": "server_number",
  "maintenance": true
}
```
### History Management

#### Get Recharge History
- **GET** `/api/history/recharge-history`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: 
  - `userId`
  - `page` (default: 1)
  - `limit` (default: 20)

#### Get Transaction History
- **GET** `/api/history/transaction-history`
- **Query Parameters**: `userId`

### Block Management

#### Toggle Block Status
- **POST** `/api/block/block-status-toggle`
- **Request Body**:
```json
{
  "blockType": "Number_Cancel|User_Fraud",
  "status": boolean
}
```

### Server Management

#### Get Server Data
- **GET** `/api/server/get-server`
- **Description**: Retrieve all server configurations

#### Update Server API Key
- **POST** `/api/server/update-api-key`
- **Request Body**:
```json
{
  "server": "server_number",
  "api_key": "new_api_key"
}
```

### Config Management

#### Get Minimum UPI Amount
- **GET** `/api/config/min-upi-amount`

#### Update Minimum UPI Amount
- **POST** `/api/config/min-upi-amount`
- **Request Body**:
```json
{
  "minUpiAmount": 100
}
```

## Additional Models

### RechargeHistory Model
```javascript
{
  userId: ObjectId,
  transactionId: String,
  method: String,
  amount: Number,
  date_time: String,
  status: String
}
```

### NumberHistory Model
```javascript
{
  userId: ObjectId,
  serviceName: String,
  server: String,
  price: Number,
  number: String,
  otps: [{
    message: String,
    date: Date
  }],
  status: String,
  date_time: String
}
```

### ServerData Model
```javascript
{
  server: Number,
  maintainance: Boolean,
  api_key: String,
  block: Boolean,
  exchangeRate: Number,
  margin: Number
}
```

## Utilities

### Telegram Integration
The system includes Telegram notifications for:
- Recharge transactions
- Number purchases
- OTP receipts
- User blocks

### IP Details
- IP tracking for security
- Geolocation data collection
- Service provider identification

## Cron Jobs

### Automated Tasks
- Transaction status updates
- Expired order cancellation
- Server balance checks
- Daily reports generation

## WebSocket Integration (if applicable)
- Real-time OTP updates
- Service status notifications
- Balance updates

## Rate Limiting Details

### Endpoints with Rate Limiting
- Authentication: 10 requests/15 minutes
- Number requests: 30 requests/minute
- OTP checks: 60 requests/minute

## Additional Security Features

1. Request Queue Management
2. Fraud Detection System
3. Transaction Validation
4. IP-based Blocking
5. Multiple OTP Protection

## Monitoring and Logging

### Metrics Collection
- Request counts
- Response times
- Error rates
- Server status

### Logging
- Transaction logs
- Error logs
- Security logs
- Performance logs

## Performance Optimization

1. Database Indexing
2. Request Queuing
3. Caching Strategies
4. Batch Processing

## Backup and Recovery

1. Database Backup Schedule
2. Transaction Logs
3. Recovery Procedures
4. Data Retention Policy
## Database Models

### User Model
```javascript
{
  email: String,
  password: String,
  googleId: String,
  role: String,
  balance: Number,
  apiKey: String,
  isVerified: Boolean,
  trxWalletAddress: String,
  status: String
}
```

### Service Model
```javascript
{
  name: String,
  servers: [{
    serverNumber: Number,
    price: Number,
    code: String,
    maintenance: Boolean
  }],
  maintenance: Boolean
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Google OAuth Integration
The system supports Google OAuth2.0 for signup and login:
- `/api/auth/google/signup`
- `/api/auth/google/login`

## Error Handling

The API uses a consistent error response format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting for login and signup endpoints:
- 10 requests per 15 minutes per IP address

## Environment Variables

| Variable | Description | Required |
|----------|-------------|-----------|
| PORT | Server port | Yes |
| MONGO_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Yes |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | Yes |
| EMAIL_USER | SMTP email user | Yes |
| EMAIL_PASS | SMTP email password | Yes |
| FRONTEND_URL | Frontend application URL | Yes |
| BACKEND_URL | Backend API URL | Yes |

## Deployment

### Production Setup
1. Set environment variables for production
2. Build the application:
```bash
npm run build
```
3. Start the server:
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Measures

1. Input Validation
2. Rate Limiting
3. JWT Authentication
4. CORS Configuration
5. Environment Variable Protection
6. Password Hashing (bcrypt)

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch
3. Follow coding standards:
   - Use ESLint configuration
   - Follow naming conventions
   - Add appropriate comments
4. Write tests for new features
5. Submit a pull request

## Testing

Run tests using:
```bash
npm test
```

The project uses Jest for testing. Test files are located in the `__tests__` directory.

## Maintenance

### Logs
- Application logs are stored in `/logs`
- Error logs are stored in `/logs/error`

### Monitoring
- Server status endpoint: `/api/health`
- Metrics endpoint: `/api/metrics`

## Support

For support and questions:
- Create an issue in the repository
- Contact: support@example.com

## License

MIT License - see LICENSE file for details