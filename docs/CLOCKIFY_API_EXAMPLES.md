# Clockify API Examples

## Status
✅ **API is live and responding** (tested 2025-09-01)

## Base URLs
- **Global**: `https://api.clockify.me/api/v1/`
- **Reports**: `https://reports.api.clockify.me/v1/`

## Authentication
Header: `X-Api-Key: <CLOCKIFY_API_KEY>`

---

## Key Endpoints for Client Matching

### 1. Get Workspace
```http
GET /api/v1/workspaces/{workspaceId}
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 200:
{
  "id": "64a687e29ae1f428e7ebe303",
  "name": "Cool Company",
  "cakeOrganizationId": "67d471fb56aa9668b7bfa295",
  "features": ["ADD_TIME_FOR_OTHERS", "ADMIN_PANEL", "ALERTS", "APPROVAL"],
  "featureSubscriptionType": "STANDARD_2021"
}
```

### 2. List All Clients
```http
GET /api/v1/workspaces/{workspaceId}/clients
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 200:
[
  {
    "id": "5a0ab5acb07987125438b60f",
    "name": "Acme Corp",
    "workspaceId": "64a687e29ae1f428e7ebe303",
    "billable": true,
    "currencyId": "CLP"
  },
  {
    "id": "5a0ab5acb07987125438b61g",
    "name": "Beta Industries",
    "workspaceId": "64a687e29ae1f428e7ebe303",
    "billable": true
  }
]
```

### 3. Get Single Client
```http
GET /api/v1/workspaces/{workspaceId}/clients/{clientId}
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 200:
{
  "id": "5a0ab5acb07987125438b60f",
  "name": "Acme Corp",
  "workspaceId": "64a687e29ae1f428e7ebe303",
  "billable": true,
  "currencyId": "CLP"
}
```

### 4. Create Client
```http
POST /api/v1/workspaces/{workspaceId}/clients
Authorization: X-Api-Key {CLOCKIFY_API_KEY}
Content-Type: application/json

Body:
{
  "name": "New Client Name",
  "billable": true,
  "currencyId": "CLP"
}

Response 201:
{
  "id": "5a0ab5acb07987125438b62h",
  "name": "New Client Name",
  "workspaceId": "64a687e29ae1f428e7ebe303",
  "billable": true,
  "currencyId": "CLP"
}
```

### 5. Update Client
```http
PUT /api/v1/workspaces/{workspaceId}/clients/{clientId}
Authorization: X-Api-Key {CLOCKIFY_API_KEY}
Content-Type: application/json

Body:
{
  "name": "Updated Client Name",
  "billable": true
}

Response 200:
{
  "id": "5a0ab5acb07987125438b60f",
  "name": "Updated Client Name",
  "workspaceId": "64a687e29ae1f428e7ebe303",
  "billable": true
}
```

### 6. Delete Client
```http
DELETE /api/v1/workspaces/{workspaceId}/clients/{clientId}
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 204: (no content)
```

---

## Key Endpoints for Reports (Time Entries)

### 7. Generate Detailed Report
```http
POST /reports/v1/workspaces/{workspaceId}/reports/detailed
Authorization: X-Api-Key {CLOCKIFY_API_KEY}
Content-Type: application/json

Body:
{
  "dateRangeStart": "2025-01-01T00:00:00Z",
  "dateRangeEnd": "2025-09-01T23:59:59Z",
  "clientIds": ["5a0ab5acb07987125438b60f"],
  "detailedFilter": {
    "pageSize": 50,
    "sortColumn": "DATE",
    "sortOrder": "DESCENDING"
  }
}

Response 200:
{
  "timeentries": [
    {
      "id": "entry123",
      "description": "Development work",
      "tagIds": [],
      "userId": "5a0ab5acb07987125438b60f",
      "userName": "Developer Name",
      "clientId": "5a0ab5acb07987125438b60f",
      "clientName": "Acme Corp",
      "projectId": "proj123",
      "projectName": "Website Redesign",
      "taskId": "task456",
      "taskName": "Backend API",
      "billable": true,
      "hourlyRate": 50,
      "duration": 7200000,  // milliseconds (2 hours)
      "timeInterval": {
        "start": "2025-08-15T09:00:00Z",
        "end": "2025-08-15T11:00:00Z",
        "duration": "PT2H"
      },
      "costRate": 30
    }
  ],
  "totals": {
    "duration": 3600000,  // total duration in ms
    "billable": 3600000,
    "unbillable": 0,
    "amount": 50,
    "cost": 30
  },
  "isGrouped": false
}
```

### 8. List Projects (for a client)
```http
GET /api/v1/workspaces/{workspaceId}/projects?clientStatus=ACTIVE
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 200:
[
  {
    "id": "proj123",
    "name": "Website Redesign",
    "workspaceId": "64a687e29ae1f428e7ebe303",
    "clientId": "5a0ab5acb07987125438b60f",
    "clientName": "Acme Corp",
    "isPublic": false,
    "archived": false,
    "note": "Major site overhaul"
  }
]
```

### 9. List Tasks (for a project)
```http
GET /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks
Authorization: X-Api-Key {CLOCKIFY_API_KEY}

Response 200:
[
  {
    "id": "task456",
    "name": "Backend API",
    "projectId": "proj123",
    "assigneeIds": [],
    "costRate": 30,
    "billableRate": 50,
    "status": "ACTIVE",
    "estimate": "PT40H"
  }
]
```

---

## Data Model Notes

### Client
- `id`: Clockify internal ID (immutable)
- `name`: Client name (searchable, matchable)
- `workspaceId`: Workspace owner
- `billable`: Whether time tracked is billable
- `currencyId`: Currency code (CLP for Chile)

### Time Entry
- `duration`: **Always in milliseconds** (multiply by 1000 to convert from seconds)
- `timeInterval.duration`: ISO-8601 format string (e.g., "PT2H" = 2 hours)
- `billable`: boolean (determines invoice eligibility)
- `hourlyRate` + `costRate`: Different rates for billing vs. cost analysis

### Pagination
- Default `pageSize`: 50 (default, can override)
- Response includes `Last-Page` header: `true` = end of data, `false` = more pages available
- Query params: `page=1`, `pageSize=50`

---

## Rate Limiting

- **50 requests per second** (per addon, per workspace)
- Exceed = `429 Too Many Requests` with message "Too many requests"

---

## Integration Checklist

- [ ] Verify `CLOCKIFY_API_KEY` in `.env`
- [ ] Test workspace list (`GET /workspaces`)
- [ ] Test client list (`GET /workspaces/{id}/clients`)
- [ ] Test detailed report generation (time entries by date range + client)
- [ ] Implement Levenshtein matching for legacy clients
- [ ] Create Portal token-based auth
- [ ] Build client-facing portal pages
