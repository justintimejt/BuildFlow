-- ============================================
-- Diagnostic Script for Chat Messages Not Saving
-- ============================================
-- Run this in Supabase SQL Editor to diagnose issues with chat message saving
-- Based on CHAT_MESSAGES_NOT_SAVING_INVESTIGATION.md

-- Step 1: Check RLS Policies on chat_messages table
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'chat_messages'
ORDER BY policyname;

-- Expected results:
-- If RLS migration was run: Should see policies like "Users can create chat messages for own projects"
-- If RLS migration was NOT run: Should see "allow anon session_id read/write chat_messages"

-- Step 2: Check if RLS is enabled
-- ============================================
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'chat_messages');

-- Step 3: Check projects and their user_id values
-- ============================================
-- Find projects with null user_id (these won't pass RLS checks)
SELECT 
    id,
    name,
    user_id,
    created_at,
    updated_at,
    CASE 
        WHEN user_id IS NULL THEN '❌ MISSING user_id - RLS will block chat messages'
        ELSE '✅ Has user_id'
    END as status
FROM projects
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- Count projects by user_id status
SELECT 
    COUNT(*) as total_projects,
    COUNT(user_id) as projects_with_user_id,
    COUNT(*) - COUNT(user_id) as projects_without_user_id
FROM projects;

-- Step 4: Check recent chat messages (if any exist)
-- ============================================
SELECT 
    cm.id,
    cm.project_id,
    p.name as project_name,
    p.user_id as project_user_id,
    cm.role,
    LEFT(cm.content, 50) as content_preview,
    cm.created_at
FROM chat_messages cm
LEFT JOIN projects p ON cm.project_id = p.id
ORDER BY cm.created_at DESC
LIMIT 20;

-- Step 5: Test insert permission (simulated - won't actually insert)
-- ============================================
-- This checks if the current role can insert into chat_messages
-- Run this while authenticated as a user or with service role

-- For service role (backend), this should always work
-- For authenticated users, this will be blocked if:
--   - RLS policies don't allow it
--   - Project doesn't belong to the user

-- Note: This is a dry-run check, actual insert may still fail
SELECT 
    'Service role should bypass RLS automatically' as note,
    'If backend is using service role key, inserts should work' as guidance;

-- Step 6: Check foreign key constraints
-- ============================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'chat_messages';

-- Expected: Should show foreign key from chat_messages.project_id -> projects.id

-- Step 7: Verify table structure
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (uuid, not null)
-- - project_id (uuid, not null)
-- - role (text, not null)
-- - content (text, not null)
-- - created_at (timestamptz, default now())

-- Step 8: Summary and Recommendations
-- ============================================
SELECT 
    '=== DIAGNOSTIC SUMMARY ===' as section,
    '' as detail
UNION ALL
SELECT 
    '1. RLS Status',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'chat_messages' 
            AND rowsecurity = true
        ) THEN 'RLS is ENABLED on chat_messages'
        ELSE 'RLS is DISABLED on chat_messages'
    END
UNION ALL
SELECT 
    '2. RLS Policies',
    COUNT(*)::text || ' policy(ies) found on chat_messages'
FROM pg_policies 
WHERE tablename = 'chat_messages'
UNION ALL
SELECT 
    '3. Projects Missing user_id',
    COUNT(*)::text || ' project(s) without user_id'
FROM projects
WHERE user_id IS NULL
UNION ALL
SELECT 
    '4. Total Chat Messages',
    COUNT(*)::text || ' message(s) in database'
FROM chat_messages
UNION ALL
SELECT 
    '5. Recommendation',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'chat_messages' 
            AND policyname LIKE '%Users can%'
        ) AND EXISTS (
            SELECT 1 FROM projects WHERE user_id IS NULL
        ) THEN '⚠️ Projects missing user_id may prevent chat messages from saving'
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'chat_messages' 
            AND policyname LIKE '%Users can%'
        ) THEN '✅ RLS policies look correct, verify service role key in backend/.env'
        ELSE '✅ Old permissive policies in place, should allow inserts'
    END;

