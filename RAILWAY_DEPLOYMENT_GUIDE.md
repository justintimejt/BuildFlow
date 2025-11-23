# Railway Deployment Integration Guide

## Overview

BuildFlow now supports deploying architecture diagrams directly to Railway infrastructure. Each node in your diagram is automatically converted to a Railway service or database.

## Features

- **One-click deployment** from diagram to Railway
- **Automatic service mapping** - nodes become Railway services
- **Database provisioning** - database nodes create Railway databases
- **Environment variable management** - dependencies automatically configured
- **Deployment status tracking** - view deployment history

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway API Token**: Get your token from [Railway Account Settings](https://railway.app/account/tokens)
3. **Supabase Project**: Your BuildFlow project must be saved to Supabase (has a project ID)

## How to Deploy

### Step 1: Create Your Diagram

Design your architecture using BuildFlow's visual editor:
- Add nodes (web servers, databases, workers, etc.)
- Connect nodes with edges
- Configure node properties in the inspector panel

### Step 2: Save Your Project

Click "Save" in the toolbar to save your project to Supabase. This creates a project ID that's required for deployment.

### Step 3: Deploy to Railway

1. Click the **"Deploy"** button in the toolbar (only visible when you have a saved project)
2. Enter your Railway API token
3. Optionally customize the Railway project name
4. Click **"Deploy"**

### Step 4: Monitor Deployment

The deployment modal will show:
- Deployment progress
- Created services and databases
- Any errors or warnings
- Link to view project on Railway

## Node Type Mappings

| BuildFlow Node | Railway Service Type | Notes |
|---------------|---------------------|-------|
| Web Server | Service | Requires code repository |
| Database | PostgreSQL Plugin | Auto-provisioned |
| Worker | Service | Requires code repository |
| Cache | Redis Plugin | Auto-provisioned |
| Queue | Service | Requires code repository |
| Storage | Service | Requires code repository |
| Compute Node | Service | Requires code repository |
| Load Balancer | Service | Nginx template |
| Message Broker | Service | Requires code repository |
| Monitoring | Service | Requires code repository |
| API Gateway | Service | Requires code repository |
| Third-party API | External | Not deployed |

## Environment Variables

The deployment automatically configures environment variables based on:

1. **Node Attributes**: Custom attributes from the inspector panel
2. **Dependencies**: Connection strings for connected services
   - Database connections → `DATABASE_URL`
   - Cache connections → `REDIS_URL`
   - Service URLs → `{SERVICE_NAME}_URL`

## Deployment Workflow

```
Diagram Nodes
    ↓
Node-to-Service Mapping
    ↓
Railway Project Creation
    ↓
Service/Database Provisioning
    ↓
Environment Variable Configuration
    ↓
Deployment Status Tracking
```

## Limitations

### Code Requirements

Most service types require actual code to run:
- **Web servers** need application code
- **Workers** need background job code
- **Services** need implementation code

**Current Solution**: Services are created as placeholders. You'll need to:
1. Connect a GitHub repository to each service
2. Or provide code via Railway CLI
3. Or use Railway templates

### Database Connections

Database connection strings are automatically generated, but you may need to:
- Configure connection pooling
- Set up migrations
- Configure database users

### Service Dependencies

Edges in your diagram are converted to environment variables, but you may need to:
- Update connection strings after deployment
- Configure service discovery
- Set up networking between services

## Troubleshooting

### "Project not found" Error

- Ensure your project is saved to Supabase
- Check that you have a valid `projectId` in the URL or props

### "Failed to create Railway project" Error

- Verify your Railway API token is valid
- Check Railway API rate limits
- Ensure you have Railway account permissions

### "Service needs code" Warning

- This is expected for most service types
- Connect a GitHub repository to the service on Railway
- Or use Railway templates to bootstrap code

### Deployment Partially Failed

- Check the errors list in the deployment modal
- Some services may have succeeded while others failed
- Retry deployment or fix issues manually on Railway

## API Reference

### Backend Endpoints

#### `POST /api/deploy/railway`

Deploy a diagram to Railway.

**Request:**
```json
{
  "projectId": "uuid",
  "railwayToken": "railway_api_token",
  "projectName": "optional-name"
}
```

**Response:**
```json
{
  "success": true,
  "railway_project_id": "railway_project_id",
  "railway_project_name": "project-name",
  "deployed_services": 3,
  "deployed_databases": 1,
  "services": [...],
  "databases": [...],
  "errors": []
}
```

#### `GET /api/deploy/status/{project_id}`

Get deployment status for a project.

**Response:**
```json
{
  "deployed": true,
  "metadata": {
    "railway_project_id": "...",
    "status": "deployed",
    ...
  }
}
```

## Database Schema

Deployment metadata is stored in the `projects` table:

```sql
-- Added to projects table
deployment_metadata jsonb

-- Or use separate deployments table
create table deployments (
  id uuid primary key,
  project_id uuid references projects(id),
  railway_project_id text,
  status text,
  ...
);
```

See `SUPABASE_SCHEMA_DEPLOYMENT.sql` for the full schema.

## Security Considerations

1. **API Tokens**: Railway tokens are stored in browser localStorage (not encrypted)
   - Consider implementing secure token storage
   - Or use OAuth flow for Railway authentication

2. **Project Access**: Deployment requires project ID
   - Ensure proper access control
   - Validate project ownership

3. **Rate Limiting**: Railway API has rate limits
   - Free tier: 100 requests/hour
   - Pro tier: 10,000 requests/hour

## Future Enhancements

- [ ] GitHub repository integration
- [ ] Automatic code generation from templates
- [ ] Deployment status sync from Railway
- [ ] Rollback capabilities
- [ ] Multi-environment support (staging, production)
- [ ] Cost estimation before deployment
- [ ] OAuth authentication for Railway
- [ ] Deployment history and logs

## Support

For issues or questions:
- Check Railway documentation: [docs.railway.com](https://docs.railway.com)
- Railway API reference: [docs.railway.com/reference/public-api](https://docs.railway.com/reference/public-api)
- BuildFlow GitHub issues

