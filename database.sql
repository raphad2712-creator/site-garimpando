-- Execute este arquivo no SQL Editor de um projeto Supabase exclusivo para o site.
create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  category_id integer,
  category_name text not null default 'Blog',
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "Leitura publica de materias" on public.blog_posts;
create policy "Leitura publica de materias"
on public.blog_posts for select
to anon, authenticated
using (published = true or auth.role() = 'authenticated');

drop policy if exists "Administrador cria materias" on public.blog_posts;
create policy "Administrador cria materias"
on public.blog_posts for insert
to authenticated
with check (true);

drop policy if exists "Administrador altera materias" on public.blog_posts;
create policy "Administrador altera materias"
on public.blog_posts for update
to authenticated
using (true) with check (true);

drop policy if exists "Administrador exclui materias" on public.blog_posts;
create policy "Administrador exclui materias"
on public.blog_posts for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Leitura publica das imagens do blog" on storage.objects;
create policy "Leitura publica das imagens do blog"
on storage.objects for select
to public
using (bucket_id = 'blog-images');

drop policy if exists "Administrador envia imagens do blog" on storage.objects;
create policy "Administrador envia imagens do blog"
on storage.objects for insert
to authenticated
with check (bucket_id = 'blog-images');

drop policy if exists "Administrador atualiza imagens do blog" on storage.objects;
create policy "Administrador atualiza imagens do blog"
on storage.objects for update
to authenticated
using (bucket_id = 'blog-images');

drop policy if exists "Administrador exclui imagens do blog" on storage.objects;
create policy "Administrador exclui imagens do blog"
on storage.objects for delete
to authenticated
using (bucket_id = 'blog-images');

create or replace function public.atualizar_data_blog()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.atualizar_data_blog();
