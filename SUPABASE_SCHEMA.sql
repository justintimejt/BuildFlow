-- Projects represent a single system design diagram
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,             -- optional for future auth
  session_id text,          -- for anonymous/local users
  name text not null,
  diagram_json jsonb not null, -- full getProject() JSON
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index projects_session_id_idx on projects(session_id);

-- Chat messages associated with a specific project
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index chat_messages_project_id_created_at_idx
  on chat_messages(project_id, created_at);

-- Row-Level Security (RLS) - For now, allow session_id-based access
alter table projects enable row level security;
alter table chat_messages enable row level security;

create policy "allow anon session_id read/write projects"
on projects
for all
using (true)
with check (true);

create policy "allow anon session_id read/write chat_messages"
on chat_messages
for all
using (true)
with check (true);

