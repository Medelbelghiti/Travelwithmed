-- Riversmag : liens affiliés qui convertissent (9 nov. 2026, validé par le propriétaire).
-- 1) Les 14 liens eSIM par ville pointaient tous vers la page d'accueil d'Airalo :
--    ils pointent maintenant vers la page eSIM du pays (vérifiée en 200).
-- 2) Liens eSIM par pays, utilisés par toutes les villes de ce pays.
-- 3) Lien transfert aéroport (Kiwitaxi via Travelpayouts) pour tout le site.
begin;
create temp table esim_map(dest text, country text) on commit drop;
insert into esim_map values
 ('athens','greece'),('bali','indonesia'),('bangkok','thailand'),('barcelona','spain'),('cairo','egypt'),
 ('lisbon','portugal'),('los-angeles','united-states'),('marrakech','morocco'),('miami','united-states'),
 ('new-york','united-states'),('paris','france'),('rio-de-janeiro','brazil'),('rome','italy'),('tokyo','japan'),
 ('greece','greece'),('indonesia','indonesia'),('thailand','thailand'),('spain','spain'),('egypt','egypt'),
 ('portugal','portugal'),('united-states','united-states'),('morocco','morocco'),('france','france'),
 ('brazil','brazil'),('italy','italy'),('japan','japan');

update "AffiliateLink" l
   set "targetUrl" = 'https://tp.media/r?campaign_id=541&marker=776824&p=8310&trs=573241&u=https%3A%2F%2Fwww.airalo.com%2F' || m.country || '-esim',
       "productName" = 'Airalo eSIM - ' || initcap(replace(m.country, '-', ' ')),
       "updatedAt" = now()
  from "Destination" d, esim_map m
 where l."destinationId" = d.id and d.slug = m.dest and l.category = 'ESIM' and l.active
   and l."targetUrl" like '%u=https%3A%2F%2Fairalo.com';

insert into "AffiliateLink" (id, "partnerName", category, "productName", "targetUrl", priority, "destinationId", "updatedAt")
select gen_random_uuid()::text, 'Airalo', 'ESIM', 'Airalo eSIM - ' || initcap(replace(m.country, '-', ' ')),
       'https://tp.media/r?campaign_id=541&marker=776824&p=8310&trs=573241&u=https%3A%2F%2Fwww.airalo.com%2F' || m.country || '-esim',
       85, d.id, now()
  from esim_map m join "Destination" d on d.slug = m.dest
 where m.dest = m.country
   and not exists (select 1 from "AffiliateLink" x where x."destinationId" = d.id and x.category = 'ESIM' and x.active);

insert into "AffiliateLink" (id, "partnerName", category, "productName", "targetUrl", priority, "updatedAt")
select gen_random_uuid()::text, 'Kiwitaxi', 'AIRPORT_TRANSFERS', 'Kiwitaxi airport transfers',
       'https://tp.media/r?campaign_id=1&marker=776824&p=647&trs=573241&u=https%3A%2F%2Fkiwitaxi.com', 70, now()
 where not exists (select 1 from "AffiliateLink" where category = 'AIRPORT_TRANSFERS' and active and "destinationId" is null);
commit;

select (select count(*) from "AffiliateLink" where category='ESIM' and active and "targetUrl" like '%u=https%3A%2F%2Fairalo.com') as esim_homepage_links_left,
       (select count(*) from "AffiliateLink" where category='ESIM' and active and "targetUrl" like '%-esim') as esim_deep_links,
       (select count(*) from "AffiliateLink" where category='AIRPORT_TRANSFERS' and active) as transfer_links;
