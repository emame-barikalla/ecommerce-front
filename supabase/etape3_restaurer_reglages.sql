-- ÉTAPE 3 (QA) : remet `settings` exactement dans l'état initial relevé avant les tests :
--   default_language = en, store_name = España a Mauritania, whatsapp_number = +222XXXXXXXX
-- et supprime les 11 clés de TEST ajoutées par l'admin (délais, livraison gratuite, chiffres…).
-- À coller EN ENTIER dans Supabase > SQL Editor > New query, puis "Run".

BEGIN;

UPDATE settings SET value = '+222XXXXXXXX'
 WHERE store_id = '00000000-0000-0000-0000-000000000001' AND key = 'whatsapp_number';

DELETE FROM settings
 WHERE store_id = '00000000-0000-0000-0000-000000000001'
   AND key NOT IN ('default_language', 'store_name', 'whatsapp_number');

COMMIT;

-- Vérification : 3 lignes attendues.
SELECT key, value FROM settings
 WHERE store_id = '00000000-0000-0000-0000-000000000001' ORDER BY key;
