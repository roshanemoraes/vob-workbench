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
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

The login and refresh endpoints return an access token plus a rotating refresh token. The refresh token is stored hashed in MongoDB and is revoked when it is used to issue a replacement token.

Password policy defaults:

- minimum length: `8`
- requires at least one letter
- requires at least one digit

Planned admin user-management endpoints will require the `USER_MANAGE` permission.

## Patient Intake

Patient intake endpoints require a JWT access token.

- `POST /api/patients` requires `PATIENT_CREATE`
- `GET /api/patients` requires `PATIENT_VIEW`
- `GET /api/patients/{id}` requires `PATIENT_VIEW`

The patient list uses cursor-based pagination. The API returns `nextCursor`; pass it back as the `cursor` query parameter to fetch the next page.

## VOB Requests

VOB request endpoints require a JWT access token.

- `POST /api/vob` requires `VOB_CREATE`
- `GET /api/vob/{id}` requires `VOB_QUEUE_VIEW` or `VOB_VIEW_OWN`
- `GET /api/vob/queue` requires `VOB_QUEUE_VIEW`

New VOB requests are created with `QUEUED` status and no assigned specialist. The queue endpoint returns MongoDB-backed queued work using cursor-based pagination sorted by `createdAt ASC, _id ASC`.

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

## Getting Started

Start local MongoDB first, then run the backend from the `backend/` directory:

```powershell
mvn spring-boot:run
```
