-- ÉTAPE 4 (QA) : supprime toutes les données créées par les tests (préfixe qa-test-).
-- À exécuter APRÈS la suppression des fichiers du Storage (voir le message de Claude) :
-- une fois le produit supprimé, plus rien ne pointe vers ses fichiers.
-- À coller EN ENTIER dans Supabase > SQL Editor > New query, puis "Run".

BEGIN;

-- Produit de test : traductions, images (lignes) et lignes de panier partent en cascade.
DELETE FROM products
 WHERE store_id = '00000000-0000-0000-0000-000000000001' AND slug = 'qa-test-produit';

-- Catégorie de test : ses traductions partent en cascade.
DELETE FROM categories
 WHERE store_id = '00000000-0000-0000-0000-000000000001' AND slug = 'qa-test-categorie';

-- Inscription newsletter de test (le message de contact a déjà été supprimé pendant le test 1.10).
DELETE FROM newsletter_subscribers WHERE email = 'qa-test@example.com';
DELETE FROM contact_messages WHERE name LIKE 'qa-test%' OR email LIKE 'qa-test%';

-- Compte admin de test : profil, identités et sessions partent en cascade.
DELETE FROM auth.users WHERE email = 'qa-test-admin@example.com';

COMMIT;

-- Vérification : tout doit valoir 0.
SELECT
  (SELECT count(*) FROM products   WHERE slug LIKE 'qa-test-%')                    AS produits,
  (SELECT count(*) FROM categories WHERE slug LIKE 'qa-test-%')                    AS categories,
  (SELECT count(*) FROM newsletter_subscribers WHERE email LIKE 'qa-test%')        AS newsletter,
  (SELECT count(*) FROM auth.users WHERE email = 'qa-test-admin@example.com')      AS utilisateur,
  (SELECT count(*) FROM public.profiles WHERE role = 'admin')                      AS admins_restants; -- attendu : 1
