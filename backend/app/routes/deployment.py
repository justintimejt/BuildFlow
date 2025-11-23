"""
Railway deployment routes
Handles deployment of diagrams to Railway infrastructure
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..supabase_client import supabase
from ..services.railway_client import RailwayClient
from ..services.deployment_mapper import DeploymentMapper
from postgrest.exceptions import APIError
import traceback
import uuid


router = APIRouter()


class DeploymentRequest(BaseModel):
    projectId: str
    railwayToken: str
    projectName: Optional[str] = None


class DeploymentStatusRequest(BaseModel):
    projectId: str
    railwayProjectId: str


@router.post("/deploy/railway")
async def deploy_to_railway(req: DeploymentRequest):
    """
    Deploy a diagram to Railway infrastructure
    
    Steps:
    1. Load diagram from Supabase
    2. Map nodes to Railway services
    3. Create Railway project
    4. Create services/databases
    5. Configure environment variables
    6. Store deployment metadata
    """
    try:
        # Validate projectId
        try:
            uuid.UUID(req.projectId)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid projectId format: {req.projectId}"
            )
        
        # Check Supabase
        if supabase is None:
            raise HTTPException(
                status_code=503,
                detail="Supabase is not configured"
            )
        
        # Load diagram from Supabase
        try:
            project_res = supabase.table("projects").select("diagram_json, name").eq("id", req.projectId).single().execute()
        except Exception as e:
            error_msg = str(e)
            # Check for "no rows" or "PGRST116" (PostgREST error code for no rows)
            if "not found" in error_msg.lower() or "no rows" in error_msg.lower() or "PGRST116" in error_msg:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Project not found in Supabase. Please save your project to Supabase first by clicking 'Save' in the toolbar."
                )
            raise HTTPException(status_code=500, detail=f"Error loading project: {error_msg}")
        
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        diagram_json = project_res.data.get("diagram_json", {})
        diagram_name = req.projectName or project_res.data.get("name", "BuildFlow Project")
        
        nodes = diagram_json.get("nodes", [])
        edges = diagram_json.get("edges", [])
        
        if not nodes:
            raise HTTPException(
                status_code=400,
                detail="Diagram has no nodes to deploy"
            )
        
        # Initialize Railway client
        try:
            railway_client = RailwayClient(req.railwayToken)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to initialize Railway client: {str(e)}"
            )
        
        # Generate Railway configuration
        railway_config = DeploymentMapper.generate_railway_config(
            nodes, edges, diagram_name
        )
        
        # Create Railway project
        try:
            railway_project = railway_client.create_project(railway_config["project_name"])
            railway_project_id = railway_project.get("id")
            
            if not railway_project_id:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create Railway project"
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create Railway project: {str(e)}"
            )
        
        # Deploy services and databases
        deployed_services = []
        deployed_databases = []
        errors = []
        
        # Deploy databases first (services may depend on them)
        for db_config in railway_config["databases"]:
            try:
                db_service = railway_client.create_database(
                    railway_project_id,
                    db_config["name"],
                    db_config.get("plugin", "postgresql")
                )
                deployed_databases.append({
                    "node_id": db_config["node_id"],
                    "railway_id": db_service.get("id"),
                    "name": db_config["name"],
                    "type": "database"
                })
            except Exception as e:
                errors.append(f"Failed to create database {db_config['name']}: {str(e)}")
        
        # Deploy services
        for service_config in railway_config["services"]:
            try:
                # For now, create a placeholder service
                # In production, you'd want to handle code repositories
                source = None  # Would need GitHub repo or template
                
                service = railway_client.create_service(
                    railway_project_id,
                    service_config["name"],
                    source
                )
                
                service_id = service.get("id")
                
                # Set environment variables
                if service_id and service_config.get("environment_variables"):
                    railway_client.set_service_variables(
                        service_id,
                        service_config["environment_variables"]
                    )
                
                deployed_services.append({
                    "node_id": service_config["node_id"],
                    "railway_id": service_id,
                    "name": service_config["name"],
                    "type": "service",
                    "needs_code": service_config.get("needs_code", True)
                })
            except Exception as e:
                errors.append(f"Failed to create service {service_config['name']}: {str(e)}")
        
        # Store deployment metadata in Supabase
        deployment_metadata = {
            "project_id": req.projectId,
            "railway_project_id": railway_project_id,
            "railway_project_name": railway_config["project_name"],
            "deployed_services": deployed_services,
            "deployed_databases": deployed_databases,
            "status": "deployed" if not errors else "partial",
            "errors": errors,
            "config": railway_config
        }
        
        try:
            # Store in deployments table (will need to create this table)
            # For now, store in projects table as metadata
            supabase.table("projects").update({
                "deployment_metadata": deployment_metadata
            }).eq("id", req.projectId).execute()
        except Exception as e:
            # Don't fail if metadata storage fails
            print(f"Warning: Failed to store deployment metadata: {e}")
        
        return {
            "success": True,
            "railway_project_id": railway_project_id,
            "railway_project_name": railway_config["project_name"],
            "deployed_services": len(deployed_services),
            "deployed_databases": len(deployed_databases),
            "services": deployed_services,
            "databases": deployed_databases,
            "errors": errors,
            "message": f"Deployed {len(deployed_services)} services and {len(deployed_databases)} databases to Railway"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in deploy_to_railway: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Deployment failed: {str(e)}"
        )


@router.get("/deploy/status/{project_id}")
async def get_deployment_status(project_id: str):
    """
    Get deployment status for a BuildFlow project
    """
    try:
        uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid projectId format")
    
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    
    try:
        project_res = supabase.table("projects").select("deployment_metadata").eq("id", project_id).single().execute()
        
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        deployment_metadata = project_res.data.get("deployment_metadata")
        
        if not deployment_metadata:
            return {
                "deployed": False,
                "message": "No deployment found for this project"
            }
        
        return {
            "deployed": True,
            "metadata": deployment_metadata
        }
        
    except APIError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

