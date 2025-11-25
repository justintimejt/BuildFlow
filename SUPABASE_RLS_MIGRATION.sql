-- ============================================
-- Migration: Secure RLS Policies
-- ============================================
-- This script replaces permissive RLS policies with secure user-based policies
-- Run this in your Supabase SQL Editor or via the migration script

BEGIN;

-- Drop old permissive policies
drop policy if exists "allow anon session_id read/write projects" on projects;
drop policy if exists "allow anon session_id read/write chat_messages" on chat_messages;

-- Projects: SELECT policy
create policy "Users can view own projects"
on projects for select
using (auth.uid() = user_id);

-- Projects: INSERT policy
create policy "Users can create own projects"
on projects for insert
with check (auth.uid() = user_id);

-- Projects: UPDATE policy
create policy "Users can update own projects"
on projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Projects: DELETE policy
create policy "Users can delete own projects"
on projects for delete
using (auth.uid() = user_id);

-- Chat Messages: SELECT policy
create policy "Users can view chat messages for own projects"
on chat_messages for select
using (
  exists (
    select 1 from projects
    where projects.id = chat_messages.project_id
    and projects.user_id = auth.uid()
  )
);

-- Chat Messages: INSERT policy
create policy "Users can create chat messages for own projects"
on chat_messages for insert
with check (
  exists (
    select 1 from projects
    where projects.id = chat_messages.project_id
    and projects.user_id = auth.uid()
  )
);

-- Chat Messages: UPDATE policy
create policy "Users can update chat messages for own projects"
on chat_messages for update
using (
  exists (
    select 1 from projects
    where projects.id = chat_messages.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from projects
    where projects.id = chat_messages.project_id
    and projects.user_id = auth.uid()
  )
);

-- Chat Messages: DELETE policy
create policy "Users can delete chat messages for own projects"
on chat_messages for delete
using (
  exists (
    select 1 from projects
    where projects.id = chat_messages.project_id
    and projects.user_id = auth.uid()
  )
);

COMMIT;

