# Surv Backend API

FastAPI backend for the Surv field service management platform.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create .env file:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

4. Run the application:
```bash
python -m uvicorn app.main:app --reload
```

5. Create test data (optional):
```bash
python create_test_data.py
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Test Credentials

After running `create_test_data.py`:

- **Admin**: admin@surv.com / admin123
- **Manager**: manager@surv.com / manager123
- **Technician**: tech@surv.com / tech123

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user info

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/{id}` - Get customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Archive customer

### Jobs
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/{id}` - Get job
- `PUT /api/v1/jobs/{id}` - Update job
- `DELETE /api/v1/jobs/{id}` - Cancel job

### Invoices
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices/{id}` - Get invoice
- `PUT /api/v1/invoices/{id}` - Update invoice
- `POST /api/v1/invoices/{id}/send` - Send invoice
- `POST /api/v1/invoices/{id}/pay` - Record payment

## Database

Using SQLite for development. The database file `surv_dev.db` will be created automatically.

To reset the database:
```bash
rm surv_dev.db  # Mac/Linux
del surv_dev.db  # Windows
python -m uvicorn app.main:app --reload
python create_test_data.py
```

## Development

Run with auto-reload:
```bash
uvicorn app.main:app --reload --port 8000
```

Run tests:
```bash
pytest
```

