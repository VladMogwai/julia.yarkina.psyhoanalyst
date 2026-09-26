-- People with access (a purchase or a grant) see the product even while it is not on sale,
-- so access given by email can be used before sales open.
create policy "Owners see their products" on public.products
  for select to authenticated using ((select private.has_purchase(slug)));
