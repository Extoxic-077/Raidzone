# NexVault — Digital Game Marketplace

> A production-grade digital goods marketplace built with Spring Boot, PostgreSQL, and vanilla JavaScript. Buy Steam wallet cards, game top-ups, gift cards, and streaming subscriptions — instantly delivered after payment.

**Kerala University · BSc Computer Science · Final Year Project**

---

## What is NexVault?

NexVault is a full-stack e-commerce platform for digital products. Users can browse a catalog of game keys, gift cards, mobile top-ups, and streaming subscriptions, pay via multiple methods including UPI and crypto, and receive their digital codes instantly by email.

The project is built without any frontend framework — pure HTML, CSS, and modern JavaScript (ES2024) on the frontend, and Java 21 with Spring Boot 3 on the backend. The goal is to demonstrate a complete, production-ready architecture that can scale from a university project to a real product.

---

## Live Demo

> Coming soon — will be deployed on Railway (backend) + Vercel (frontend)

---

## Screenshots

> Screenshots will be added after frontend is complete (Phase 2)

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Primary language |
| Spring Boot | 3.3.x | Web framework |
| Spring Data JPA | 3.3.x | Database ORM |
| Spring Security | 6.x | Authentication (Phase 2) |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Caching and sessions |
| RabbitMQ | 3.x | Async email queue |
| Elasticsearch | 8.x | Product search |
| Flyway | 10.x | Database migrations |
| Lombok | 1.18.x | Boilerplate reduction |
| SpringDoc OpenAPI | 2.x | Swagger UI |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 + CSS3 | Structure and styling |
| JavaScript ES2024 | Logic and interactivity |
| Syne + DM Sans | Typography (Google Fonts) |
| JetBrains Mono | Price displays |

### Payments
| Provider | Methods |
|---|---|
| Stripe | Cards, Google Pay, Apple Pay |
| Razorpay | UPI, PayTM, NetBanking |
| Coinbase Commerce | Bitcoin, Ethereum, USDT |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Compose | Local development containers |
| Prometheus | Metrics collection |
| Grafana | Metrics visualisation |
| Cloudinary | Product image storage |

---

## Features

### Customer-facing
- Browse digital products across 5 categories
- Search with fuzzy matching and typo tolerance (Elasticsearch)
- Filter by category, price range, region, and rating
- Product detail page with redemption instructions
- Shopping cart (stored in Redis, survives browser refresh)
- Wishlist
- 3-step checkout with progress indicator
- Multiple payment methods: cards, UPI, PayTM, Google Pay, Apple Pay, crypto
- Discount coupon codes (percentage and fixed amount)
- Instant email delivery of digital keys after payment
- PDF receipt download
- Order history in user profile
- Product reviews — only available after verified purchase
- Star rating with review count per product

### Authentication
- Email + password registration with OTP verification
- Login with Google, Discord, or Telegram
- JWT access tokens (15 minute expiry)
- Secure refresh token rotation via HttpOnly cookie

### Admin panel
- Add and edit products without touching code
- Live product card preview while filling the form
- Upload product images via drag and drop (Cloudinary)
- Dashboard with revenue, order, and user stats
- Order management with status updates
- Server log viewer with level filtering (INFO / WARN / ERROR)
- User management

### Technical
- REST API with consistent JSON response envelope
- Swagger UI at `/swagger-ui.html`
- Spring Boot Actuator health checks at `/actuator/health`
- Prometheus metrics at `/actuator/prometheus`
- Structured JSON logs with per-request trace IDs
- Audit log table for all user actions
- Rate limiting on auth endpoints via Redis
- Mobile-first responsive design
- PWA — installable as a phone app

---

## Project Structure

```
NexVault/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/NexVault/backend/
│       │   ├── config/          # CORS, OpenAPI, Redis, RabbitMQ, Security
│       │   ├── controller/      # REST endpoints
│       │   ├── service/         # Business logic
│       │   ├── repository/      # JPA repositories
│       │   ├── model/           # JPA entities
│       │   ├── dto/             # Request and response DTOs
│       │   ├── security/        # JWT, OAuth2, filters
│       │   ├── event/           # RabbitMQ events
│       │   ├── listener/        # Email event listeners
│       │   └── exception/       # Global error handling
│       └── main/resources/
│           ├── application.yml
│           └── db/migration/    # Flyway SQL files
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── docker-compose.yml
├── prometheus.yml
└── docs/
    ├── DOCUMENTATION.md   # Every class and method documented
    ├── API.md             # All endpoints with curl examples
    ├── SETUP.md           # Step-by-step local setup
    └── ARCHITECTURE.md    # Design decisions
```

---

## Getting Started

### Prerequisites

- Java 21 — [Download](https://adoptium.net)
- Maven 3.9+ — [Download](https://maven.apache.org)
- Docker Desktop — [Download](https://www.docker.com/products/docker-desktop)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/NexVault.git
cd NexVault
```

### 2. Start the database and Redis

```bash
docker-compose up -d
```

Wait about 10 seconds, then verify both containers are running:

```bash
docker-compose ps
```

You should see `NexVault-db` with status `healthy` and `NexVault-redis` running.

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The first startup automatically applies all Flyway migrations and seeds the database with sample data. Wait for this line in the console:

```
Started BackendApplication in X.XXX seconds
```

### 4. Verify the API is working

```bash
# Health check
curl http://localhost:8080/actuator/health

# List all categories
curl http://localhost:8080/api/v1/categories

# Featured products
curl http://localhost:8080/api/v1/products/featured
```

### 5. Open Swagger UI

Navigate to [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) to explore all endpoints interactively.

### 6. Serve the frontend

```bash
cd frontend
python3 -m http.server 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Overview

All endpoints return the same response envelope:

```json
{
  "success": true,
  "data": { },
  "message": "OK",
  "timestamp": "2025-03-28T14:30:00Z"
}
```

### Public endpoints (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/categories` | All product categories |
| GET | `/api/v1/products` | Paginated product list with filters |
| GET | `/api/v1/products/featured` | Top 8 products for homepage |
| GET | `/api/v1/products/flash-deals` | Flash deal products |
| GET | `/api/v1/products/{id}` | Single product by UUID |
| GET | `/api/v1/products/slug/{slug}` | Single product by slug |
| GET | `/api/v1/search?q=steam` | Full-text search |
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |

### Authenticated endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users/me` | Current user profile |
| GET | `/api/v1/cart` | View cart |
| POST | `/api/v1/cart/items` | Add item to cart |
| POST | `/api/v1/orders` | Place order |
| GET | `/api/v1/orders/my` | Order history |
| POST | `/api/v1/payments/stripe/intent` | Create Stripe payment |
| POST | `/api/v1/wishlist/items` | Add to wishlist |
| POST | `/api/v1/reviews` | Post a review |

Full API documentation with request/response examples is in [`docs/API.md`](docs/API.md).

---

## Environment Variables

Create a `.env` file in the project root for production secrets. For local development the defaults in `application.yml` work without any setup.

```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/NexVault
DB_USER=NexVault
DB_PASS=NexVault

# JWT (generate a secure random string)
JWT_SECRET=your-secret-key-min-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Coinbase Commerce
COINBASE_API_KEY=...
COINBASE_WEBHOOK_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Gmail SMTP
MAIL_USER=your@gmail.com
MAIL_PASS=your-app-password

# Telegram Bot
TELEGRAM_BOT_TOKEN=...

# OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

---

## Development Roadmap

The project is built in 12 phases. Each phase produces a working, runnable application.

| Phase | What gets built | Status |
|---|---|---|
| 1 | Spring Boot setup, PostgreSQL, Flyway migrations, product catalog API | ✅ Complete |
| 2 | JWT authentication, registration, login | 🔄 In progress |
| 3 | Flyway refinement, in-memory cart, basic order creation | ⏳ Planned |
| 4 | Stripe payment integration, email receipts | ⏳ Planned |
| 5 | User profile, reviews (purchase-verified), wishlist | ⏳ Planned |
| 6 | Redis cache, RabbitMQ async email queue | ⏳ Planned |
| 7 | OAuth2 (Google, Discord, Telegram), OTP email verification | ⏳ Planned |
| 8 | Elasticsearch product search with fuzzy matching | ⏳ Planned |
| 9 | Razorpay (UPI/PayTM), Coinbase crypto payments, coupons | ⏳ Planned |
| 10 | Structured logging, Actuator, Prometheus, Grafana | ⏳ Planned |
| 11 | Cloudinary image uploads, PDF receipts, admin panel API | ⏳ Planned |
| 12 | Unit tests, integration tests, documentation, PWA | ⏳ Planned |

---

## Running Tests

```bash
cd backend
mvn test
```

Integration tests use Testcontainers — Docker must be running when you execute them.

To generate a coverage report:

```bash
mvn test jacoco:report
open target/site/jacoco/index.html
```

---

## Monitoring

Start the full monitoring stack:

```bash
docker-compose --profile monitoring up -d
```

| URL | Service |
|---|---|
| http://localhost:8080/actuator/health | Spring Health |
| http://localhost:8080/swagger-ui.html | Swagger UI |
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (admin / admin) |
| http://localhost:15672 | RabbitMQ Management (guest / guest) |

---

## Documentation

| File | Contents |
|---|---|
| [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) | Every class and method explained |
| [`docs/API.md`](docs/API.md) | All endpoints with curl examples and sample responses |
| [`docs/SETUP.md`](docs/SETUP.md) | Detailed local setup from zero |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technology choices and data flow |

---

## Contributing

This is a university final project. It is not open for external contributions at this stage. Feel free to fork it and use it as a reference for your own projects.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built by Hemra Ashyrov as a final year project for the BSc Computer Science programme at Kerala University.
