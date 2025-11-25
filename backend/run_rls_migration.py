#!/usr/bin/env python3
"""
Supabase RLS Migration Script
Executes the RLS policy migration SQL against the Supabase database.

This script uses the Supabase REST API to execute SQL queries.
It requires the service role key from your backend/.env file.
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("❌ Error: psycopg2 is required but not installed")
    print("   Install it with: pip install psycopg2-binary")
    sys.exit(1)

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.env import Env
except ImportError:
    print("❌ Error: Could not import Env from app.env")
    print("   Make sure you're running this from the backend directory")
    sys.exit(1)


def get_db_connection_string(supabase_url: str) -> str:
    """
    Construct PostgreSQL connection string from Supabase URL.
    Supabase database connection uses the same host as the API URL but with different port.
    """
    # Supabase database connection typically uses port 5432
    # The connection string format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
    
    # Extract host from Supabase URL
    parsed = urlparse(supabase_url)
    host = parsed.hostname
    
    # Try to get database password from environment
    # The password can be found in Supabase Dashboard > Project Settings > Database
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not db_password:
        # Try alternative environment variable names
        db_password = os.getenv("DATABASE_PASSWORD") or os.getenv("POSTGRES_PASSWORD")
    
    if not db_password:
        print("❌ Error: Database password is required")
        print("\n💡 To get your database password:")
        print("   1. Go to Supabase Dashboard > Your Project")
        print("   2. Navigate to: Settings > Database")
        print("   3. Find the 'Connection string' section")
        print("   4. Copy the password from the connection string")
        print("\n   Then set it as an environment variable:")
        print("   export SUPABASE_DB_PASSWORD='your_password_here'")
        print("\n   Or add it to backend/.env file:")
        print("   SUPABASE_DB_PASSWORD=your_password_here")
        print("\n⚠️  Alternative: You can run the SQL file directly in Supabase SQL Editor:")
        print(f"   File: {Path(__file__).parent.parent / 'SUPABASE_RLS_MIGRATION.sql'}")
        sys.exit(1)
    
    # Construct PostgreSQL connection string
    # Supabase uses connection pooling on port 6543, or direct connection on port 5432
    # Try direct connection first (port 5432)
    connection_string = f"postgresql://postgres:{db_password}@{host}:5432/postgres?sslmode=require"
    return connection_string


def execute_migration():
    """Execute the RLS migration SQL file."""
    
    # Validate environment
    try:
        Env.validate()
        supabase_url = Env.SUPABASE_URL
        print(f"✅ Found Supabase URL: {supabase_url}")
    except RuntimeError as e:
        print(f"❌ Error: {e}")
        print("   Make sure backend/.env file has SUPABASE_URL set")
        sys.exit(1)
    
    # Read migration SQL file
    migration_file = Path(__file__).parent.parent / "SUPABASE_RLS_MIGRATION.sql"
    if not migration_file.exists():
        print(f"❌ Error: Migration file not found at {migration_file}")
        sys.exit(1)
    
    print(f"✅ Found migration file: {migration_file}")
    
    # Read SQL content
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    print("📄 Migration SQL loaded")
    print("\n" + "="*70)
    print("MIGRATION SUMMARY:")
    print("="*70)
    print("1. Drop old permissive RLS policies")
    print("2. Create secure SELECT policy for projects")
    print("3. Create secure INSERT policy for projects")
    print("4. Create secure UPDATE policy for projects")
    print("5. Create secure DELETE policy for projects")
    print("6. Create secure SELECT policy for chat_messages")
    print("7. Create secure INSERT policy for chat_messages")
    print("8. Create secure UPDATE policy for chat_messages")
    print("9. Create secure DELETE policy for chat_messages")
    print("="*70)
    
    # Get database connection string
    connection_string = get_db_connection_string(supabase_url)
    
    # Execute migration
    print("\n🔄 Connecting to database...")
    try:
        conn = psycopg2.connect(connection_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        print("🚀 Executing migration...\n")
        
        # Execute SQL
        cursor.execute(sql_content)
        
        print("✅ Migration executed successfully!")
        print("\n" + "="*70)
        print("VERIFICATION:")
        print("="*70)
        
        # Verify policies were created
        cursor.execute("""
            SELECT policyname, tablename 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('projects', 'chat_messages')
            ORDER BY tablename, policyname;
        """)
        
        policies = cursor.fetchall()
        if policies:
            print("\n📋 Current RLS Policies:")
            for policy_name, table_name in policies:
                print(f"   ✓ {table_name}: {policy_name}")
        else:
            print("⚠️  Warning: No policies found (this might be expected if query failed)")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("\n⚠️  IMPORTANT: Test your application to ensure RLS policies work correctly.")
        print("   See SUPABASE_RLS_POLICIES.md for testing procedures.")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print("\n💡 Tips:")
        print("   1. Check that SUPABASE_DB_PASSWORD is correct")
        print("   2. Verify your Supabase project is active")
        print("   3. Check your network connection")
        sys.exit(1)
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print(f"   Error details: {e.pgcode} - {e.pgerror}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    print("="*70)
    print("SUPABASE RLS MIGRATION SCRIPT")
    print("="*70)
    print()
    
    execute_migration()

