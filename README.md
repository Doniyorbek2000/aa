# Webpul

Monorepo (pnpm workspaces). Hujjatlar: [docs/README.md](docs/README.md).

## Talablar

- Node.js 24+, pnpm 11 (`corepack enable`)
- Docker (lokal Postgres va Redis uchun)

## Ishga tushirish

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:deploy      # migratsiyalarni qo‘llash
pnpm typecheck      # Prisma client generatsiyasi + tsc
pnpm lint
```

## Buyruqlar

| Buyruq | Vazifa |
|---|---|
| `pnpm db:migrate` | Sxema o‘zgarishidan yangi migratsiya yaratish (dev) |
| `pnpm db:deploy` | Mavjud migratsiyalarni qo‘llash |
| `pnpm db:check` | `prisma validate` + format tekshiruvi |
| `pnpm db:generate` | Prisma client generatsiyasi |

## Tuzilma

```
apps/            # web (Next.js), api (NestJS), worker — keyingi haftalarda
packages/db/     # Prisma sxema, migratsiyalar, client (@webpul/db)
docker/          # Lokal servislar uchun init skriptlar
docs/            # Phase 0 hujjatlari
```

Init migratsiyada qo‘lda qo‘shilgan qismlar: `citext` kengaytmasi, `audit_logs` uchun faqat-qo‘shish triggeri, admin rollari.
