# HYPD URL Shortener

A professional URL shortening service with HYPD product scraping capabilities, built with Node.js, Express, and PostgreSQL.

## Features

- **URL Shortening**: Convert long URLs to short, shareable links
- **HYPD Product Integration**: Special handling for HYPD product URLs with metadata scraping
- **Analytics**: Track clicks, first/last click timestamps, and user information
- **URL Expiry**: Set expiration dates for shortened URLs
- **Scalable Architecture**: Built with scalability and maintainability in mind

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Testing**: Jest, Supertest
- **Development**: Nodemon, ESLint, Prettier

## Prerequisites

- Node.js (>= 16.0.0)
- PostgreSQL (>= 12.0)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hypd-url-shortener
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb hypd_url_shortener

# Run the application to initialize schema
npm run dev
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hypd_url_shortener
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Application Configuration
BASE_URL=http://localhost:3000
SHORT_CODE_LENGTH=6
DEFAULT_EXPIRY_DAYS=30

# HYPD Configuration
HYPD_BASE_URL=https://www.hypd.store
```

## API Endpoints

### Health Check
- `GET /health` - Check service health

### URL Management
- `POST /api/urls` - Create a shortened URL
- `GET /:shortCode` - Redirect to original URL
- `GET /api/urls/:shortCode/analytics` - Get URL analytics

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
├── config/              # Configuration files
├── database/            # Database schema and initialization
├── docs/               # Documentation
├── src/
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── tests/              # Test files
├── .env.example        # Environment variables template
└── package.json        # Dependencies and scripts
```

## License

ISC

## Author

Your Name
