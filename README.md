# VOB Workbench

Role-based Verification of Benefits Workbench for healthcare revenue cycle management.

## Monorepo Structure

- `backend/` - Spring Boot API using Java, Maven, Spring Data MongoDB, and OpenAPI.
- `frontend/` - Angular web application.
- `docs/` - Requirements, SRS sections, API notes, and architecture documentation.
- `ops/` - Docker Compose and local operations assets.

## Roles

- `ADMIN` - Supervises VOB work, assigns requests, views dashboard, and reviews audit history.
- `FRONT_DESK_OPERATOR` - Records patient intake data and creates VOB requests.
- `SPECIALIST` - Processes queued VOB requests, records eligibility results, and completes verification.

## Backend Auth

The backend uses Spring Security with JWT Bearer tokens. Users have one role, and each role grants a set of permissions used as Spring Security authorities.

Development seed users are enabled by default:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | `ADMIN` |
| `frontdesk` | `frontdesk123` | `FRONT_DESK_OPERATOR` |
| `specialist` | `specialist123` | `SPECIALIST` |

Auth endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

## Getting Started

Start local MongoDB first, then run the backend from the `backend/` directory:

```powershell
mvn spring-boot:run
```
