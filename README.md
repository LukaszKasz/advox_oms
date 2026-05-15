# Advox OMS - Order Management System

Aplikacja do zarządzania zamówieniami oparta na szablonie autentykacji.

## 📋 Opis

Aplikacja zawiera niezbędne komponenty do autentykacji użytkowników:
- Rejestracja użytkownika (username, email, password)
- Logowanie użytkownika (JWT token)
- Prosty Dashboard po zalogowaniu
- Wylogowanie
- Wielojęzyczność (PL/EN)

## 🛠️ Stack Technologiczny

### Backend
- **FastAPI** - nowoczesny framework Python do budowy API
- **PostgreSQL 15** - relacyjna baza danych
- **SQLAlchemy** - ORM dla Pythona
- **JWT (python-jose)** - autentykacja tokenami
- **Bcrypt** - hashowanie haseł
- **Pydantic** - walidacja danych

### Frontend
- **React 18** - biblioteka UI
- **Vite** - build tool
- **React Router** - routing
- **Axios** - HTTP client
- **i18next** - wielojęzyczność
- **Tailwind CSS** - stylowanie

### Infrastructure
- **Docker** - konteneryzacja
- **Docker Compose** - orkiestracja kontenerów
- **Nginx** - serwer produkcyjny dla frontendu

## 📦 Wymagania

- Docker Desktop (z WSL2 na Windows)
- Docker Compose

## 🚀 Uruchomienie

### 1. Przejście do katalogu projektu

```bash
cd /home/lkasztelan/projekty/advox_oms
```

### 2. Uruchomienie aplikacji

```bash
docker compose up --build
```

Pierwsze uruchomienie może potrwać kilka minut (pobieranie obrazów, instalacja zależności).

### 3. Dostęp do aplikacji

- **Frontend**: http://localhost:3300/advox-oms/
- **Backend API**: http://localhost:8001
- **API Documentation (Swagger)**: http://localhost:8001/docs
- **PostgreSQL**: localhost:5432

## 🗂️ Struktura Projektu

```
advox_oms/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py              # Główny plik aplikacji FastAPI
│   ├── database.py          # Konfiguracja bazy danych
│   ├── models.py            # Model User
│   └── auth.py              # Logika autentykacji JWT
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js           # API client
│       ├── i18n.js          # Konfiguracja wielojęzyczności
│       ├── index.css
│       └── components/
│           ├── LoginForm.jsx
│           ├── RegisterForm.jsx
│           ├── Dashboard.jsx
│           └── LanguageSwitcher.jsx
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Konfiguracja

### Zmienne środowiskowe

Skopiuj `.env.example` do `.env` i dostosuj wartości:

```bash
cp .env.example .env
```

Domyślne wartości:
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=advox_oms_db`
- `SECRET_KEY=your-secret-key-change-in-production-please`

**WAŻNE**: Zmień `SECRET_KEY` w środowisku produkcyjnym!

## 🛑 Zatrzymanie aplikacji

```bash
docker compose down
```

Aby usunąć również wolumeny (baza danych):

```bash
docker compose down -v
```

## 📊 API Endpoints

### Publiczne (bez autentykacji)

- `GET /` - Health check
- `POST /register` - Rejestracja użytkownika
- `POST /login` - Logowanie (zwraca JWT token)
- `GET /health` - Health check dla Dockera

### Chronione (wymagają JWT token)

- `GET /me` - Informacje o zalogowanym użytkowniku

## 🔐 Bezpieczeństwo

- Hasła są hashowane za pomocą bcrypt
- Autentykacja oparta na JWT tokenach
- Tokeny wygasają po 30 minutach
- CORS skonfigurowany dla localhost
- Walidacja danych wejściowych (Pydantic)
- Security headers w nginx

## 🧹 Czyszczenie

Usunięcie wszystkich kontenerów, obrazów i wolumenów:

```bash
docker compose down -v --rmi all
```

## 📚 Dalszy rozwój

Ta aplikacja jest podstawą do budowy systemu zarządzania zamówieniami (OMS).
