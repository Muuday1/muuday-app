# 05 — API Reference (v1)

Complete reference for all `/api/v1/*` endpoints consumed by the mobile app.

## Authentication

All endpoints (except public taxonomy/catalog and blog) require authentication via:
- **Cookie session** (web) — handled automatically by `createApiClient`
- **Bearer JWT** (mobile) — `Authorization: Bearer <supabase-jwt>`
- **Mobile API Key** — `X-Mobile-API-Key: <key>` (validated in middleware)

## Base URL

```
https://<host>/api/v1
```

## Response Format

All responses are JSON. Success responses wrap data in `{ data: ... }` or `{ success: true, ... }`. Error responses use:

```json
{ "error": "Human-readable message" }
```

HTTP status codes:
- `200` — Success
- `201` — Created
- `400` — Bad request / validation error
- `401` — Unauthorized (missing/invalid auth)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `429` — Rate limit exceeded
- `500` — Server error

---

## Users

### `GET /users/me`

Returns the current authenticated user's profile.

**Auth:** Required  
**Rate limit:** `apiV1UserProfile`  

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "João Silva",
    "role": "usuario",
    "avatar_url": "https://...",
    "country": "BR",
    "timezone": "America/Sao_Paulo"
  }
}
```

---

## Onboarding

### `POST /onboarding/complete-account`

Completes user account after OAuth/password signup.

**Auth:** Required  
**Rate limit:** `apiV1OnboardingCompleteAccount`  

**Body:**
```json
{
  "role": "usuario",
  "fullName": "João Silva",
  "country": "BR",
  "timezone": "America/Sao_Paulo"
}
```

**Response:**
```json
{ "success": true }
```

### `POST /onboarding/complete-profile`

Completes professional profile (first-time setup).

**Auth:** Required  
**Rate limit:** `apiV1OnboardingCompleteProfile`  

**Body:**
```json
{
  "bio": "Psicólogo clínico...",
  "category": "psicologia",
  "tags": ["ansiedade", "depressão"],
  "languages": ["pt", "en"],
  "yearsExperience": 5,
  "sessionPriceBrl": 150,
  "sessionDurationMinutes": 50
}
```

**Response:**
```json
{ "success": true, "professionalId": "uuid" }
```

---

## Taxonomy & Catalog

### `GET /taxonomy/catalog`

Returns the professional signup/catalog taxonomy (categories, subcategories, specialties). Public endpoint.

**Auth:** None  
**Rate limit:** `apiV1TaxonomyCatalog`  

**Response:**
```json
{
  "data": {
    "categories": [{ "slug": "psicologia", "name": "Psicologia", "icon": "🧩" }],
    "specialtyOptionsByCategory": { "psicologia": ["Ansiedade", "Depressão"] },
    "subcategoryOptionsByCategory": { "psicologia": [{ "slug": "clinica", "name": "Clínica" }] },
    "specialtyOptionsBySubcategory": { "clinica": ["Ansiedade"] },
    "subcategoryDirectory": [{ "slug": "clinica", "name": "Clínica", "categorySlug": "psicologia", "categoryName": "Psicologia" }]
  }
}
```

---

## Professionals

### `GET /professionals/search`

Search professionals with filters.

**Auth:** Required  
**Rate limit:** `apiV1ProfessionalsSearch`  

**Query params:**
- `q` — search text
- `category` — category slug
- `specialty` — specialty slug
- `language` — language code
- `minPrice`, `maxPrice` — price range
- `sort` — `rating`, `price_asc`, `price_desc`, `newest`
- `limit`, `offset` — pagination

**Response:**
```json
{
  "data": {
    "professionals": [...],
    "total": 100
  }
}
```

### `GET /professionals/[id]/services`

List services for a specific professional.

**Auth:** None (public)  
**Rate limit:** `apiV1ProfessionalsRead`  

**Response:**
```json
{
  "data": {
    "services": [
      { "id": "uuid", "name": "Sessão individual", "price_brl": 150, "duration_minutes": 50 }
    ]
  }
}
```

### `GET /professionals/me`

Returns the current professional's profile.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalProfile`  

**Response:** Professional profile object.

### `POST /professionals/me`

Creates or updates the professional profile.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalProfile`  

**Body:**
```json
{
  "bio": "...",
  "category": "psicologia",
  "tags": "ansiedade,depressao",
  "languages": "pt,en",
  "years_experience": "5",
  "session_price_brl": "150",
  "session_duration_minutes": "50"
}
```

### `PATCH /professionals/me`

Saves a professional profile draft.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalProfile`  

**Body:**
```json
{
  "professionalId": "uuid",
  "category": "psicologia",
  "bio": "...",
  "tags": ["ansiedade"],
  "languages": ["pt"],
  "yearsExperience": 5,
  "sessionPriceBrl": 150,
  "sessionDurationMinutes": 50
}
```

### `POST /professionals/me/submit-for-review`

Submits the professional profile for admin review.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalProfile`  

**Response:**
```json
{ "success": true, "onboardingState": { ... } }
```

### `GET /professionals/me/availability`

Get recurring availability schedule.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1AvailabilityRead`  

### `POST /professionals/me/availability`

Update recurring availability.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1AvailabilityWrite`  

### `GET /professionals/me/availability-exceptions`

List availability exceptions.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1AvailabilityRead`  

### `POST /professionals/me/availability-exceptions`

Create an availability exception.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1AvailabilityWrite`  

### `DELETE /professionals/me/availability-exceptions/[exceptionId]`

Delete an availability exception.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1AvailabilityWrite`  

### `GET /professionals/me/services`

List own services.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalServicesRead`  

### `POST /professionals/me/services`

Create a service.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalServicesWrite`  

### `PATCH /professionals/me/services/[serviceId]`

Update a service.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalServicesWrite`  

### `DELETE /professionals/me/services/[serviceId]`

Delete a service.

**Auth:** Required (professional role)  
**Rate limit:** `apiV1ProfessionalServicesWrite`  

---

## Bookings

### `GET /bookings`

List bookings for the authenticated user (client or professional).

**Auth:** Required  
**Rate limit:** `apiV1BookingsList`  

**Query params:**
- `status` — filter by status
- `limit` — default 50
- `offset` — default 0

**Response:**
```json
{
  "data": {
    "bookings": [...],
    "total": 20
  }
}
```

### `POST /bookings`

Create a new booking.

**Auth:** Required  
**Rate limit:** `apiV1BookingsCreate`  

**Body:**
```json
{
  "professionalId": "uuid",
  "scheduledAt": "2026-05-01T14:00:00",
  "notes": "...",
  "bookingType": "one_off",
  "sessionPurpose": "..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "bookingId": "uuid",
  "createdBookingIds": ["uuid"]
}
```

### `GET /bookings/[id]`

Get booking detail.

**Auth:** Required  
**Rate limit:** `apiV1BookingsDetail`  

### `PATCH /bookings/[id]/confirm`

Confirm a booking (professional action).

**Auth:** Required  
**Rate limit:** `apiV1BookingConfirm`  

### `PATCH /bookings/[id]/cancel`

Cancel a booking.

**Auth:** Required  
**Rate limit:** `apiV1BookingCancel`  

**Body:**
```json
{ "reason": "Cliente solicitou cancelamento" }
```

### `PATCH /bookings/[id]/reschedule`

Reschedule a booking.

**Auth:** Required  
**Rate limit:** `apiV1BookingReschedule`  

**Body:**
```json
{ "newScheduledAt": "2026-05-02T15:00:00" }
```

### `PATCH /bookings/[id]/complete`

Mark booking as completed.

**Auth:** Required (professional)  
**Rate limit:** `apiV1BookingComplete`  

### `PATCH /bookings/[id]/session-link`

Add/update video session link.

**Auth:** Required (professional)  
**Rate limit:** `apiV1BookingComplete`  

**Body:**
```json
{ "link": "https://meet.example.com/abc" }
```

### `POST /bookings/[id]/report-no-show`

Report professional no-show.

**Auth:** Required (client)  
**Rate limit:** `apiV1BookingComplete`  

### `POST /bookings/[id]/mark-user-no-show`

Mark client as no-show.

**Auth:** Required (professional)  
**Rate limit:** `apiV1BookingComplete`  

---

## Request Bookings

### `GET /bookings/requests`

List request bookings.

**Auth:** Required  
**Rate limit:** `apiV1RequestBookingRead`  

### `POST /bookings/requests`

Create a request booking.

**Auth:** Required  
**Rate limit:** `apiV1RequestBookingCreate`  

**Body:**
```json
{
  "professionalId": "uuid",
  "preferredDates": ["2026-05-01T14:00:00"],
  "notes": "..."
}
```

### `GET /bookings/requests/[id]`

Get request booking detail.

**Auth:** Required  
**Rate limit:** `apiV1RequestBookingRead`  

### `POST /bookings/requests/[id]/offer`

Professional offers a specific time for a request.

**Auth:** Required (professional)  
**Rate limit:** `apiV1RequestBookingWrite`  

### `POST /bookings/requests/[id]/accept`

Client accepts the professional's offer.

**Auth:** Required (client)  
**Rate limit:** `apiV1RequestBookingWrite`  

### `POST /bookings/requests/[id]/decline-professional`

Professional declines the request.

**Auth:** Required (professional)  
**Rate limit:** `apiV1RequestBookingWrite`  

### `POST /bookings/requests/[id]/decline-user`

Client declines the offer.

**Auth:** Required (client)  
**Rate limit:** `apiV1RequestBookingWrite`  

### `POST /bookings/requests/[id]/cancel-user`

Client cancels the request.

**Auth:** Required (client)  
**Rate limit:** `apiV1RequestBookingWrite`  

---

## Reviews

### `GET /reviews`

List reviews (for a professional or by the current user).

**Auth:** Required  
**Rate limit:** `apiV1ReviewRead`  

### `POST /reviews`

Create a review.

**Auth:** Required  
**Rate limit:** `apiV1ReviewWrite`  

**Body:**
```json
{
  "bookingId": "uuid",
  "professionalId": "uuid",
  "rating": 5,
  "comment": "Excelente atendimento!"
}
```

### `POST /reviews/[id]/response`

Professional responds to a review.

**Auth:** Required (professional)  
**Rate limit:** `apiV1ReviewResponse`  

**Body:**
```json
{ "responseText": "Obrigado pelo feedback!" }
```

---

## Favorites

### `GET /favorites`

List favorite professionals.

**Auth:** Required  
**Rate limit:** `apiV1FavoritesRead`  

### `POST /favorites`

Add a professional to favorites.

**Auth:** Required  
**Rate limit:** `apiV1FavoritesWrite`  

**Body:**
```json
{ "professionalId": "uuid" }
```

### `DELETE /favorites`

Remove a professional from favorites.

**Auth:** Required  
**Rate limit:** `apiV1FavoritesWrite`  

**Body:**
```json
{ "professionalId": "uuid" }
```

---

## Conversations (Chat)

### `GET /conversations`

List conversations for the current user.

**Auth:** Required  
**Rate limit:** `apiV1ConversationsRead`  

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "bookingId": "uuid",
        "otherParticipantName": "Dra. Maria",
        "otherParticipantId": "uuid",
        "otherParticipantRole": "profissional",
        "lastMessageContent": "Olá!",
        "lastMessageSentAt": "2026-04-20T10:00:00Z",
        "lastMessageSenderId": "uuid",
        "unreadCount": 2
      }
    ]
  }
}
```

### `GET /conversations/[id]/messages`

Get messages for a conversation.

**Auth:** Required  
**Rate limit:** `apiV1MessagesRead`  

**Query params:**
- `limit` — default 50
- `cursor` — pagination cursor

### `POST /conversations/[id]/messages`

Send a message.

**Auth:** Required  
**Rate limit:** `apiV1MessagesWrite`  

**Body:**
```json
{ "content": "Olá, tudo bem?" }
```

### `POST /conversations/[id]/read`

Mark conversation as read.

**Auth:** Required  
**Rate limit:** `apiV1MessagesRead`  

---

## Notifications

### `GET /notifications`

List notifications.

**Auth:** Required  
**Rate limit:** `apiV1NotificationsRead`  

**Query params:**
- `limit` — default 20
- `cursor` — pagination cursor
- `unreadOnly` — boolean

### `PATCH /notifications/[id]/read`

Mark a notification as read.

**Auth:** Required  
**Rate limit:** `apiV1NotificationsWrite`  

### `POST /notifications/unread-count`

Get unread notification count.

**Auth:** Required  
**Rate limit:** `apiV1NotificationsRead`  

---

## Disputes

### `GET /disputes`

List dispute cases.

**Auth:** Required  
**Rate limit:** `apiV1DisputesRead`  

### `POST /disputes`

Open a new dispute case.

**Auth:** Required  
**Rate limit:** `apiV1DisputesWrite`  

**Body:**
```json
{
  "bookingId": "uuid",
  "reason": "...",
  "description": "..."
}
```

### `GET /disputes/[caseId]`

Get dispute case details.

**Auth:** Required  
**Rate limit:** `apiV1DisputesRead`  

### `POST /disputes/[caseId]/messages`

Add a message to a dispute case.

**Auth:** Required  
**Rate limit:** `apiV1DisputesWrite`  

**Body:**
```json
{ "content": "..." }
```

---

## Client Records

### `GET /client-records`

List client records for the professional.

**Auth:** Required (professional)  
**Rate limit:** `apiV1ClientRecordsRead`  

### `GET /client-records/[userId]`

Get detailed record for a specific client.

**Auth:** Required (professional)  
**Rate limit:** `apiV1ClientRecordsRead`  

### `POST /client-records/notes`

Add a note to a client record.

**Auth:** Required (professional)  
**Rate limit:** `apiV1ClientRecordsWrite`  

**Body:**
```json
{
  "userId": "uuid",
  "content": "..."
}
```

---

## Push Notifications

### `POST /push/subscribe`

Subscribe a push notification token.

**Auth:** Required  
**Rate limit:** `apiV1PushSubscribe`  

**Body:**
```json
{
  "token": "fcm-token-here",
  "platform": "android" // or "ios"
}
```

### `POST /push/unsubscribe`

Unsubscribe a push notification token.

**Auth:** Required  
**Rate limit:** `apiV1PushSubscribe`  

**Body:**
```json
{ "token": "fcm-token-here" }
```

---

## Blog (Public)

### `GET /blog/comments`

Get comments for an article.

**Auth:** None  
**Rate limit:** `apiV1BlogRead`  

**Query params:**
- `slug` — article slug

### `POST /blog/comments`

Add a comment.

**Auth:** None  
**Rate limit:** `apiV1BlogWrite`  

**Body:**
```json
{
  "slug": "article-slug",
  "name": "Visitante",
  "email": "visitor@example.com",
  "content": "Ótimo artigo!"
}
```

### `POST /blog/likes`

Toggle a like.

**Auth:** None  
**Rate limit:** `apiV1BlogWrite`  

**Body:**
```json
{
  "slug": "article-slug",
  "visitorId": "visitor-uuid"
}
```

---

## Guides (Public)

### `POST /guides/useful`

Mark a guide as useful.

**Auth:** None  
**Rate limit:** `apiV1GuideUseful`  

**Body:**
```json
{
  "slug": "guide-slug",
  "visitorId": "visitor-uuid"
}
```

### `POST /guides/reports`

Report a guide issue.

**Auth:** None  
**Rate limit:** `apiV1GuideReport`  

**Body:**
```json
{
  "slug": "guide-slug",
  "visitorId": "visitor-uuid",
  "message": "Link quebrado na seção 3"
}
```

---

## Admin

> ⚠️ **Admin endpoints require `role === 'admin'`**

### `GET /admin/dashboard`

Admin dashboard data.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminRead`  

### `GET /admin/plans`

List plan configs.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminRead`  

### `POST /admin/plans`

Update plan configs.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

### `GET /admin/taxonomy`

Load full taxonomy + pending tag suggestions.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminRead`  

### `POST /admin/taxonomy/items`

Insert a new taxonomy item.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

### `PATCH /admin/taxonomy/items/[id]`

Update a taxonomy item.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

### `PATCH /admin/taxonomy/items/[id]/toggle-active`

Toggle active status.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

### `PATCH /admin/professionals/[id]/status`

Update professional status.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

**Body:**
```json
{ "status": "approved", "note": "..." }
```

### `PATCH /admin/professionals/[id]/first-booking-gate`

Enable/disable first booking gate.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

**Body:**
```json
{ "enabled": true, "note": "..." }
```

### `POST /admin/professionals/[id]/review-decision`

Admin review decision with structured adjustments.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

**Body:**
```json
{
  "decision": "approved", // or "needs_changes" / "rejected"
  "note": "...",
  "adjustments": [
    { "stageId": "profile", "fieldKey": "bio", "message": "...", "severity": "medium" }
  ]
}
```

### `POST /admin/professionals/[id]/restore-adjustments`

Restore previous review adjustments.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

### `PATCH /admin/reviews/[id]/visibility`

Toggle review visibility.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

**Body:**
```json
{ "visible": true }
```

### `DELETE /admin/reviews/[id]`

Delete a review.

**Auth:** Required (admin)  
**Rate limit:** `apiV1AdminWrite`  

---

## KYC

### `POST /kyc/scan`

Scan/upload KYC document.

**Auth:** Required  
**Rate limit:** `apiV1KycScan`  

---

## Rate Limit Reference

| Preset | Limit | Window |
|---|---|---|
| `apiV1UserProfile` | 60 | 60s |
| `apiV1ProfessionalProfile` | 30 | 60s |
| `apiV1ProfessionalsSearch` | 30 | 60s |
| `apiV1BookingsList` | 60 | 60s |
| `apiV1BookingsCreate` | 10 | 60s |
| `apiV1BookingsDetail` | 60 | 60s |
| `apiV1BookingConfirm` | 10 | 60s |
| `apiV1BookingCancel` | 10 | 60s |
| `apiV1BookingReschedule` | 10 | 60s |
| `apiV1BookingComplete` | 10 | 60s |
| `apiV1RequestBookingCreate` | 6 | 120s |
| `apiV1RequestBookingWrite` | 10 | 60s |
| `apiV1RequestBookingRead` | 30 | 60s |
| `apiV1ReviewRead` | 60 | 60s |
| `apiV1ReviewWrite` | 10 | 60s |
| `apiV1ReviewResponse` | 10 | 60s |
| `apiV1FavoritesRead` | 60 | 60s |
| `apiV1FavoritesWrite` | 20 | 60s |
| `apiV1ConversationsRead` | 60 | 60s |
| `apiV1MessagesRead` | 60 | 60s |
| `apiV1MessagesWrite` | 60 | 60s |
| `apiV1NotificationsRead` | 60 | 60s |
| `apiV1NotificationsWrite` | 30 | 60s |
| `apiV1DisputesRead` | 30 | 60s |
| `apiV1DisputesWrite` | 10 | 60s |
| `apiV1ClientRecordsRead` | 30 | 60s |
| `apiV1ClientRecordsWrite` | 10 | 60s |
| `apiV1AvailabilityRead` | 60 | 60s |
| `apiV1AvailabilityWrite` | 10 | 60s |
| `apiV1ProfessionalServicesRead` | 60 | 60s |
| `apiV1ProfessionalServicesWrite` | 10 | 60s |
| `apiV1OnboardingCompleteProfile` | 10 | 60s |
| `apiV1OnboardingCompleteAccount` | 10 | 60s |
| `apiV1TaxonomyCatalog` | 60 | 60s |
| `apiV1BlogRead` | 60 | 60s |
| `apiV1BlogWrite` | 10 | 60s |
| `apiV1GuideUseful` | 20 | 60s |
| `apiV1GuideReport` | 10 | 60s |
| `apiV1AdminRead` | 60 | 60s |
| `apiV1AdminWrite` | 30 | 60s |
| `apiV1PushSubscribe` | 10 | 60s |
| `apiV1KycScan` | 10 | 60s |
