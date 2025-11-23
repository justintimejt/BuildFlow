"""
Railway API Client for GraphQL operations
Handles communication with Railway's GraphQL API
"""
from typing import Dict, List, Optional, Any
from gql import Client, gql
from gql.transport.httpx import HTTPXTransport
import httpx
import json


class RailwayClient:
    """Client for interacting with Railway's GraphQL API"""
    
    RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
    
    def __init__(self, api_token: str):
        """
        Initialize Railway client with API token
        
        Args:
            api_token: Railway API token from user's account
        """
        self.api_token = api_token
        transport = HTTPXTransport(
            url=self.RAILWAY_API_URL,
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            }
        )
        self.client = Client(transport=transport, fetch_schema_from_transport=False)
    
    def create_project(self, name: str) -> Dict[str, Any]:
        """
        Create a new Railway project
        
        Args:
            name: Project name
            
        Returns:
            Project data including ID
        """
        query = gql("""
            mutation CreateProject($name: String!) {
                projectCreate(name: $name) {
                    id
                    name
                    createdAt
                }
            }
        """)
        
        result = self.client.execute(query, variable_values={"name": name})
        return result.get("projectCreate", {})
    
    def create_service(
        self, 
        project_id: str, 
        name: str, 
        source: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new service in a Railway project
        
        Args:
            project_id: Railway project ID
            name: Service name
            source: Optional source configuration (repo, template, etc.)
            
        Returns:
            Service data including ID
        """
        query = gql("""
            mutation CreateService($projectId: String!, $name: String!, $source: ServiceSourceInput) {
                serviceCreate(projectId: $projectId, name: $name, source: $source) {
                    id
                    name
                    projectId
                    createdAt
                }
            }
        """)
        
        variables = {
            "projectId": project_id,
            "name": name
        }
        if source:
            variables["source"] = source
        
        result = self.client.execute(query, variable_values=variables)
        return result.get("serviceCreate", {})
    
    def create_database(self, project_id: str, name: str, plugin: str = "postgresql") -> Dict[str, Any]:
        """
        Create a database service in Railway
        
        Args:
            project_id: Railway project ID
            name: Database name
            plugin: Database type (postgresql, mysql, mongodb, redis)
            
        Returns:
            Database service data
        """
        query = gql("""
            mutation CreateDatabase($projectId: String!, $name: String!, $plugin: String!) {
                pluginCreate(projectId: $projectId, name: $name, plugin: $plugin) {
                    id
                    name
                    projectId
                    createdAt
                }
            }
        """)
        
        result = self.client.execute(
            query, 
            variable_values={
                "projectId": project_id,
                "name": name,
                "plugin": plugin
            }
        )
        return result.get("pluginCreate", {})
    
    def set_service_variables(self, service_id: str, variables: Dict[str, str]) -> bool:
        """
        Set environment variables for a service
        
        Args:
            service_id: Service ID
            variables: Dictionary of variable names to values
            
        Returns:
            True if successful
        """
        # Railway uses a mutation to set variables
        query = gql("""
            mutation SetVariables($serviceId: String!, $variables: [VariableInput!]!) {
                variablesSet(serviceId: $serviceId, variables: $variables) {
                    id
                }
            }
        """)
        
        variable_inputs = [
            {"name": key, "value": value}
            for key, value in variables.items()
        ]
        
        try:
            result = self.client.execute(
                query,
                variable_values={
                    "serviceId": service_id,
                    "variables": variable_inputs
                }
            )
            return result.get("variablesSet") is not None
        except Exception as e:
            print(f"Error setting variables: {e}")
            return False
    
    def get_project(self, project_id: str) -> Dict[str, Any]:
        """
        Get project details
        
        Args:
            project_id: Railway project ID
            
        Returns:
            Project data
        """
        query = gql("""
            query GetProject($projectId: String!) {
                project(id: $projectId) {
                    id
                    name
                    createdAt
                    services {
                        id
                        name
                    }
                }
            }
        """)
        
        result = self.client.execute(query, variable_values={"projectId": project_id})
        return result.get("project", {})
    
    def get_service(self, service_id: str) -> Dict[str, Any]:
        """
        Get service details including deployment status
        
        Args:
            service_id: Service ID
            
        Returns:
            Service data
        """
        query = gql("""
            query GetService($serviceId: String!) {
                service(id: $serviceId) {
                    id
                    name
                    projectId
                    deployments {
                        id
                        status
                        createdAt
                        url
                    }
                }
            }
        """)
        
        result = self.client.execute(query, variable_values={"serviceId": service_id})
        return result.get("service", {})
    
    def trigger_deployment(self, service_id: str) -> Dict[str, Any]:
        """
        Trigger a new deployment for a service
        
        Args:
            service_id: Service ID
            
        Returns:
            Deployment data
        """
        query = gql("""
            mutation TriggerDeployment($serviceId: String!) {
                deploymentCreate(serviceId: $serviceId) {
                    id
                    status
                    createdAt
                }
            }
        """)
        
        result = self.client.execute(query, variable_values={"serviceId": service_id})
        return result.get("deploymentCreate", {})

