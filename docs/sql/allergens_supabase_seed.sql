-- Seed data for Allergens policy v1

insert into public.allergen_rules (
  id,
  label,
  short_label,
  keywords,
  aliases,
  has_subtypes,
  is_active,
  sort_order
)
values
  ('gluten', 'Cereals containing gluten', 'Gluten', '{wheat,rye,barley,oats,spelt,kamut,semolina,durum,couscous,malt,gluten}', '{gluten,"cereals containing gluten"}', true, true, 10),
  ('crustaceans', 'Crustaceans', 'Crustaceans', '{crustacean,prawn,shrimp,crab,lobster,langoustine,scampi}', '{crustaceans,crustacean}', false, true, 20),
  ('eggs', 'Eggs', 'Eggs', '{egg,albumin,ovalbumin}', '{egg,eggs}', false, true, 30),
  ('fish', 'Fish', 'Fish', '{fish,salmon,tuna,cod,anchovy,sardine}', '{fish}', false, true, 40),
  ('peanuts', 'Peanuts', 'Peanuts', '{peanut,groundnut,arachis}', '{peanut,peanuts,groundnut}', false, true, 50),
  ('soybeans', 'Soybeans', 'Soy', '{soy,soya,soybean,edamame,tofu,miso,tempeh}', '{soy,soya,soybeans,soybean}', false, true, 60),
  ('milk', 'Milk', 'Milk', '{milk,cream,butter,cheese,whey,lactose,casein,yoghurt,yogurt}', '{milk,dairy}', false, true, 70),
  ('nuts', 'Nuts', 'Nuts', '{almond,hazelnut,walnut,cashew,pecan,"brazil nut",pistachio,macadamia,nut}', '{nuts,nut}', true, true, 80),
  ('celery', 'Celery', 'Celery', '{celery,celeriac}', '{celery}', false, true, 90),
  ('mustard', 'Mustard', 'Mustard', '{mustard}', '{mustard}', false, true, 100),
  ('sesame', 'Sesame', 'Sesame', '{sesame,tahini}', '{sesame}', false, true, 110),
  ('sulphites', 'Sulphur dioxide / sulphites', 'Sulphites', '{sulphite,sulfite,"sulphur dioxide","sulfur dioxide",e220,e221,e222,e223,e224,e226,e227,e228}', '{sulphites,sulfites,"sulphur dioxide","sulfur dioxide"}', false, true, 120),
  ('lupin', 'Lupin', 'Lupin', '{lupin}', '{lupin}', false, true, 130),
  ('molluscs', 'Molluscs', 'Molluscs', '{mollusc,molluscs,mussel,clam,oyster,squid,octopus}', '{mollusc,molluscs}', false, true, 140)
on conflict (id)
  do update set
    label = excluded.label,
    short_label = excluded.short_label,
    keywords = excluded.keywords,
    aliases = excluded.aliases,
    has_subtypes = excluded.has_subtypes,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.allergen_subtypes (
  id,
  allergen_id,
  label,
  is_active,
  sort_order
)
values
  ('wheat', 'gluten', 'Wheat', true, 10),
  ('rye', 'gluten', 'Rye', true, 20),
  ('barley', 'gluten', 'Barley', true, 30),
  ('oats', 'gluten', 'Oats', true, 40),
  ('spelt', 'gluten', 'Spelt', true, 50),
  ('kamut', 'gluten', 'Kamut', true, 60),
  ('hybridised-strains', 'gluten', 'Hybridised strains of the above', true, 70),
  ('almonds', 'nuts', 'Almonds', true, 10),
  ('hazelnuts', 'nuts', 'Hazelnuts', true, 20),
  ('walnuts', 'nuts', 'Walnuts', true, 30),
  ('cashews', 'nuts', 'Cashews', true, 40),
  ('pecan-nuts', 'nuts', 'Pecan nuts', true, 50),
  ('brazil-nuts', 'nuts', 'Brazil nuts', true, 60),
  ('pistachio-nuts', 'nuts', 'Pistachio nuts', true, 70),
  ('macadamia-queensland', 'nuts', 'Macadamia / Queensland nuts', true, 80)
on conflict (id)
  do update set
    allergen_id = excluded.allergen_id,
    label = excluded.label,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

-- Intentionally no seed rows for raw_material_allergen_declarations:
-- declarations should come from supplier specs and QA review.