# Connections Module

## Purpose
Professional networking layer for BCET Connect (student ↔ faculty ↔ alumni). Manages the two-step "send request → accept → relationship exists" workflow. **Not** a follow system, not a chat system, not a notification system — see boundaries below.

## Owner
This module owns exactly two things:
- `ConnectionRequest` — the pending/decided workflow record
- `Connection` — the resulting active relationship (only exists once accepted)

Nothing else. It does not create conversations, does not send notifications, does not call `syncUserIntelligence()`, and does not modify any `users`, `search`, or `recommendation` model.

## Dependencies
| This module reads | This module never writes to |
|---|---|
| Nothing outside its own models | `users/*`, `search/*`, `recommendation/*`, `mentorship/*` |

Future modules read **from** Connections (one-directional):
- **Search** — via `connection.service.js`'s exported `getConnectionStatus(userId, otherUserId)`, to show a "Connected" / "Pending" badge on a profile.
- **Communication Access Engine** (future) — will call the same `getConnectionStatus()` to decide whether two users are allowed to message each other.
- **Recommendation** (future, optional) — could read `Connection` for a "mutual connections" signal. Connections will never call into Recommendation.

## Public API

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/connections/requests` | required | Send a connection request |
| GET | `/connections/requests` | required | Pending requests received |
| GET | `/connections/requests/sent` | required | Requests you've sent |
| PATCH | `/connections/requests/:requestId/accept` | required | Only the receiver can accept |
| PATCH | `/connections/requests/:requestId/reject` | required | Only the receiver can reject |
| PATCH | `/connections/requests/:requestId/cancel` | required | Only the requester can cancel |
| GET | `/connections/connections` | required | Your active connections |
| GET | `/connections/connections/status/:userId` | required | `none / pending_sent / pending_received / connected` |
| DELETE | `/connections/connections/:userId` | required | Soft-remove a connection |

## Database Models
- `ConnectionRequest`: `requesterId`, `receiverId`, `message`, `status`, `statusHistory`, `respondedAt`, `rejectionReason`
- `Connection`: `userA`, `userB` (canonically ordered, unique compound index), `status`, `removedBy`, `removedAt`

## State Machine
```
ConnectionRequest:  pending ──accept──> accepted (→ Connection created)
                    pending ──reject──> rejected
                    pending ──cancel──> cancelled

Connection:         active ──remove──> removed
```

## What this module deliberately does NOT do (Phase 1)
- No conversation/message creation — that's the future Communication module's job, triggered from *outside* this service (in whatever calls `acceptRequest()`'s result), not from inside it.
- No notifications — no Notification module exists yet.
- No mutual-connections computation, no blocking — future scope.

## Future Roadmap
1. **Communication module** consumes `getConnectionStatus()` as one of its "can these two users talk?" checks (alongside Mentorship's accepted-request check).
2. **Notification module** subscribes to request-created/accepted/rejected events (see `NOTIFICATION_EVENTS` in `connection.constants.js` for the stable event names already reserved).
3. **Recommendation** may eventually read `Connection` for a mutual-connections signal — read-only, same direction as everything else in this table.