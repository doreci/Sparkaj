-- ============================================================
-- Supabase Storage RLS Policies za bucket 'profilne'
-- Pokreni ove naredbe u Supabase SQL editoru
-- ============================================================

-- 1. Omogući RLS na storage.objects tablici (ako već nije)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Obriši stare policije ako postoje (opcionalno, ako su pogrešne)
-- DROP POLICY IF EXISTS "allow_upload_own_files" ON storage.objects;
-- DROP POLICY IF EXISTS "allow_read_own_files" ON storage.objects;

-- 3. Policija za INSERT (upload) - dozvoli authenticated korisniku da uploaduje u svoj folder
-- Provjeravamo: bucket_id = 'profilne' AND prvi dio path-a = auth.uid()
CREATE POLICY "allow_upload_own_files" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profilne'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 4. Policija za SELECT (čitanje) - dozvoli čitanje samo iz vlastitog foldera
CREATE POLICY "allow_read_own_files" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profilne'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 5. Policija za UPDATE - dozvoli ažuriranje samo vlastitih datoteka (ako trebas)
CREATE POLICY "allow_update_own_files" ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'profilne'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 6. Policija za DELETE - dozvoli brisanje samo vlastitih datoteka (ako trebas)
CREATE POLICY "allow_delete_own_files" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profilne'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- ============================================================
-- Provjera: prikaži sve policije na storage.objects
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
-- ============================================================
