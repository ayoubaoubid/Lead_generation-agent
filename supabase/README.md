# Supabase

Ce dossier contient la configuration locale, les migrations versionnées, le seed de
développement et les tests pgTAP/RLS. La conception et les commandes sont documentées
dans [`docs/DATABASE_FOUNDATION.md`](../docs/DATABASE_FOUNDATION.md).

```powershell
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:types
```

Ces scripts ciblent la pile locale. Ne jamais exécuter `db push`, `db reset --linked`
ou une migration distante sans autorisation explicite et revue préalable.
