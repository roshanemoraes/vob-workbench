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
- `GET /api/vob?status=QUEUED` requires `VOB_QUEUE_VIEW` or `VOB_VIEW_OWN`
- `POST /api/vob/{id}/claim` requires `VOB_CLAIM`
- `POST /api/vob/{id}/verify-api` requires `VOB_VERIFY_API`
- `POST /api/vob/{id}/verify-manual` requires `VOB_VERIFY_MANUAL`

New VOB requests are created with `QUEUED` status and no assigned specialist. The VOB list endpoint supports status filtering with cursor-based pagination and `sortOrder=asc|desc`.

VOB lifecycle:

```text
QUEUED -> IN_PROGRESS -> VERIFIED
                     -> FAILED_TO_VERIFY
```

Specialists claim queued VOBs to move them into `IN_PROGRESS`. Verification can be completed through the mocked API flow or through manual verification, both of which populate the embedded `eligibilityResult`.

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

## Getting Started

Start local MongoDB first, then run the backend from the `backend/` directory:

```powershell
mvn spring-boot:run
```
