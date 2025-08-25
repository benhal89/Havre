create extension if not exists vector;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  lat double precision,
  lng double precision,
  tags text[],
  summary text,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.place_embeddings (
  place_id uuid primary key references public.places(id) on delete cascade,
  embedding vector(1024)
);

create index if not exists idx_place_embed on public.place_embeddings
using ivfflat (embedding vector_cosine_ops);

create or replace function public.search_places(query_embedding vector, match_count int)
returns table (
  id uuid,
  name text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  tags text[],
  summary text,
  url text,
  similarity float
) language sql stable as $$
  select p.id, p.name, p.city, p.country, p.lat, p.lng, p.tags, p.summary, p.url,
         1 - (pe.embedding <-> query_embedding) as similarity
  from public.place_embeddings pe
  join public.places p on p.id = pe.place_id
  order by pe.embedding <-> query_embedding
  limit match_count;
$$;

grant execute on function public.search_places(vector,int) to anon, authenticated;
