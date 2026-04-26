# Raidzone — Digital Game Marketplace

> A production-grade digital goods marketplace built with Spring Boot, PostgreSQL, and vanilla JavaScript. Buy Steam wallet cards, game top-ups, gift cards, and streaming subscriptions — instantly delivered after payment.


---

## What is Raidzone?

Raidzone is a full-stack e-commerce platform for digital products. Users can browse a catalog of game keys, gift cards, mobile top-ups, and streaming subscriptions, pay via cards or UPI, and receive their digital codes instantly by email after OTP-verified redemption.

The project is built without any frontend framework — pure HTML, CSS, and modern JavaScript on the frontend, and Java 21 with Spring Boot 3 on the backend. The goal is to demonstrate a complete, production-ready architecture that can scale from a university project to a real product.

---

## Live Demo

> **[raidzonemarket.com](https://raidzonemarket.com)** — live and running on a Google Cloud VM (Nginx + Spring Boot + PostgreSQL)

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Primary language |
| Spring Boot | 3.4.x | Web framework |
| Spring Data JPA | 3.4.x | Database ORM |
| Spring Security | 6.x | Authentication & authorization |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cart storage and OTP cooldown |
| Flyway | 10.x | Database migrations (V1–V22) |
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
| Coinbase Commerce | Coming soon |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Compose | Local development containers |
| Prometheus | Metrics collection |
| Grafana | Metrics visualisation |
| Cloudinary | Product image storage |
| Nginx | Reverse proxy + SSL termination |
| GitHub Actions | CI/CD — deploy on push to master |

---

## Features

### Customer-facing
- Browse digital products across multiple categories with hierarchical accordion sidebar
- Filter by category, price range, company, and minimum rating
- Search products by name, description, or brand (PostgreSQL full-text ILIKE)
- Product detail page with redemption instructions and average star rating
- Shopping cart stored in Redis (survives browser refresh)
- Wishlist
- Checkout with order summary and coupon code field
- Multiple payment methods: cards, UPI, PayTM (Stripe + Razorpay)
- Discount coupon codes (percentage and fixed amount)
- Instant email delivery of digital key after payment, with OTP-gated reveal
- HTML order receipt email sent automatically after payment confirmation
- Order history in user profile with status grouping (confirmed, pending, cancelled)
- OTP-protected digital key reveal (one-time reveal per session, masked otherwise)
- Out-of-stock indicator on product cards; items auto-deactivate when stock hits zero
- Product reviews — only available after verified purchase, with interactive star rating
- In-app notification bell (desktop navbar) with unread badge and 60-second polling
- Full notifications page listing all system events
- Newsletter subscription (subscribe/unsubscribe from footer)
- Contact form — sends a formatted email to the store admin
- Partnership enquiry form — separate branded email template

### Authentication
- 2-step email + password login: password check → OTP email → JWT issued
- Email registration with OTP verification
- Login with Google or Discord (OAuth2 Authorization Code Flow, stateless JWT)
- JWT access tokens (15-minute expiry) with HttpOnly refresh token rotation
- New-device login notification email
- Email change via OTP (sent to new email)
- Password change via OTP (sent to current email)
- Password reset flow

### Admin panel
- Dashboard with revenue, order, and user stats (current month vs previous month comparison)
- Add and edit products with live preview card while filling the form
- Upload product images via drag and drop (Cloudinary)
- Order management with status updates
- Payment list with provider and status filters
- Category management with parent/child accordion hierarchy
- Company/brand management
- Digital key warehouse: add keys per product, view/edit/delete keys, stock status
- Email campaign composer: write, preview, and send to all subscribers
- User management
- Server log viewer with level filtering (INFO / WARN / ERROR)
- Monitoring page with embedded Grafana dashboard and Swagger UI tab

### Technical
- REST API with consistent JSON response envelope
- Swagger UI at `/swagger-ui.html`
- Spring Boot Actuator health checks at `/actuator/health`
- Prometheus metrics at `/actuator/prometheus`
- Structured JSON logs with per-request correlation IDs
- OTP resend cooldown (60-second rate limit via OtpService)
- Mobile-first responsive design
- Mobile navbar: logo + avatar top bar + 3-item bottom nav (Home / Catalog / Cart)

---

## Project Structure

```
Raidzone/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/Raidzone/
│       │   ├── config/          # CORS, OpenAPI, Redis, Security
│       │   ├── controller/      # REST endpoints
│       │   ├── service/         # Business logic
│       │   ├── repository/      # JPA repositories
│       │   ├── model/           # JPA entities
│       │   ├── dto/             # Request and response DTOs
│       │   ├── security/        # JWT filters and OAuth2
│       │   └── exception/       # Global error handling
│       └── main/resources/
│           ├── application.yml
│           └── db/migration/    # Flyway V1–V22
├── frontend/
│   ├── index.html
│   ├── admin/                   # Admin panel pages
│   ├── css/
│   └── js/
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── docker-compose.prod.yml
├── prometheus.yml
└── LOCAL_DEV.md
```

---

## Getting Started

### Prerequisites

- Java 21 — [Download](https://adoptium.net)
- Maven 3.9+
- Docker Desktop — [Download](https://www.docker.com/products/docker-desktop)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Raidzone.git
cd Raidzone
```

### 2. Start PostgreSQL and Redis

```bash
docker-compose up -d
```

Verify both containers are running:

```bash
docker-compose ps
```

You should see `hashvault-db` with status `healthy` and `hashvault-redis` running.

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The first startup automatically applies all Flyway migrations and seeds the database with sample data. Wait for:

```
Started BackendApplication in X.XXX seconds
```

### 4. Verify the API

```bash
# Health check
curl http://localhost:8080/actuator/health

# List categories
curl http://localhost:8080/api/v1/categories

# Featured products
curl http://localhost:8080/api/v1/products/featured
```

### 5. Open Swagger UI

Navigate to [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) to explore all endpoints.

### 6. Serve the frontend

See [LOCAL_DEV.md](LOCAL_DEV.md) for the dev proxy server setup (routes `/api/*` requests to the backend, avoids CORS in development).

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
| GET | `/api/v1/products/featured` | Top products for homepage |
| GET | `/api/v1/products/flash-deals` | Flash deal products |
| GET | `/api/v1/products/{id}` | Single product by UUID |
| GET | `/api/v1/products/slug/{slug}` | Single product by slug |
| POST | `/api/v1/auth/register` | Start registration (sends OTP) |
| POST | `/api/v1/auth/verify-email` | Complete registration with OTP |
| POST | `/api/v1/auth/login` | Start login (sends OTP) |
| POST | `/api/v1/auth/verify-otp` | Complete login, receive JWT |
| POST | `/api/v1/contact` | Submit contact form |
| POST | `/api/v1/partnerships` | Submit partnership enquiry |
| POST | `/api/v1/subscribe` | Subscribe to newsletter |
| DELETE | `/api/v1/subscribe` | Unsubscribe from newsletter |

### Authenticated endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users/me` | Current user profile |
| GET | `/api/v1/cart` | View cart |
| POST | `/api/v1/cart/items` | Add item to cart |
| POST | `/api/v1/orders` | Place order |
| GET | `/api/v1/orders/my` | Order history |
| POST | `/api/v1/payments/stripe/intent` | Create Stripe payment intent |
| POST | `/api/v1/wishlist/items` | Add to wishlist |
| POST | `/api/v1/reviews` | Post a verified purchase review |
| GET | `/api/v1/notifications` | List notifications |
| GET | `/api/v1/notifications/count` | Unread count |
| PUT | `/api/v1/notifications/read-all` | Mark all as read |
| POST | `/api/v1/purchases/send-reveal-otp` | Request key reveal OTP |
| POST | `/api/v1/purchases/reveal-key` | Reveal digital key with OTP |

---

## Environment Variables

For local development the defaults in `application.yml` work without any setup (see `LOCAL_DEV.md`). For production:

```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/raidzone
DB_USER=raidzone
DB_PASS=raidzone

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Gmail SMTP
MAIL_USER=your@gmail.com
MAIL_PASS=your-app-password

# OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

# CORS
CORS_ALLOWED_ORIGINS=https://raidzonemarket.com
OAUTH_REDIRECT_BASE_URL=https://raidzonemarket.com
```

---

## Development Roadmap

| Phase | What gets built | Status |
|---|---|---|
| 1 | Spring Boot setup, PostgreSQL, Flyway migrations, product catalog API | Done |
| 2 | JWT authentication, registration, login | Done |
| 3 | Flyway refinement, Redis cart, basic order creation | Done |
| 4 | Stripe payment integration, email receipts | Done |
| 5 | User profile, reviews (purchase-verified), wishlist | Done |
| 6 | Redis cart persistence, OTP rate limiting | Done |
| 7 | OAuth2 (Google, Discord), 2-step OTP login and registration | Done |
| 8 | PostgreSQL product search with category and company filters | Done |
| 9 | Razorpay (UPI/PayTM), coupon codes | Done |
| 10 | Structured logging, Actuator, Prometheus, Grafana | Done |
| 11 | Cloudinary image uploads, HTML receipt emails, admin panel | Done |
| 12 | Contact/partnership forms, category accordion UI, admin UX polish | Done |
| 13 | In-app notifications (bell, dropdown, /notifications.html) | Done |
| 14 | Digital keys warehouse, OTP-gated key reveal, stock management | Done |
| 15 | Email campaign system, newsletter subscription | Done |
| 16 | Company management, admin warehouse and campaigns panels | Done |
| 17 | Admin KPI month-over-month comparison, footer mobile accordion | Done |
| 18 | Static pages (about, careers, blog, press, help, legal pages) | Done |

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
| http://localhost:3001 | Grafana (admin / hashvault) |

---

## Contributing

This is a university final project. It is not open for external contributions at this stage. Feel free to fork it and use it as a reference for your own projects.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built by Hemra Ashyrov as a final year project for the BSc Computer Science programme at Kerala University.
