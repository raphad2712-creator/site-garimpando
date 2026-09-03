-- Execute uma vez no SQL Editor do Supabase.
-- Este comando não apaga matérias já publicadas.
alter table public.blog_posts
add column if not exists is_featured boolean not null default false;
