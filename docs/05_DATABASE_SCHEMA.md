# 05 — Ma’lumotlar bazasi sxemasi

> Qamrab oladi: DATABASE_SCHEMA. PostgreSQL + Prisma.
> Konvensiyalar: jadval nomlari `snake_case` ko‘plikda; `id` — UUID v7 (vaqt bo‘yicha tartiblangan); har jadvalda `created_at`, kerak bo‘lsa `updated_at`.
> **Pul:** `BIGINT` tiyinda (`amount_minor`) + `currency CHAR(3)`. Kurslar: `NUMERIC(18,6)`. Float ishlatilmaydi.
> Bu mantiqiy sxema. Prisma `schema.prisma` Phase 1 boshida shundan yoziladi.

## 1. Domenlar xaritasi

```
Identity ── users, sessions, oauth_accounts, workspaces, workspace_members, roles, user_roles
Billing ─── plans, plan_prices, plan_entitlements, subscriptions, subscription_events,
            entitlement_overrides, orders, payments, payment_events, refunds, invoices,
            ledger_accounts, ledger_entries
Usage ───── usage_counters, ai_usage_events, ai_cost_rates, api_keys, api_usage_events
Spell ───── dictionary_versions, dictionary_entries, spell_feedback, documents
Currency ── currencies, official_rates, banks, bank_rates, rate_alerts
Calc ────── tax_rules, saved_calculations
Prices ──── categories, brands, products, product_variants, merchants, merchant_feeds,
            offers, price_history, match_candidates, clicks, conversions, price_alerts
Ads ─────── advertisers, campaigns, placements, creatives, ad_impressions, ad_clicks
Platform ── audit_logs, feature_flags, notifications, analytics_events
```

## 2. Identity

### users
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| email | citext UNIQUE | |
| email_verified_at | timestamptz NULL | |
| password_hash | text NULL | argon2id; OAuth foydalanuvchilarda NULL |
| name | text NULL | |
| locale | text | `uz`, `uz-Cyrl`, `ru`, `en` |
| status | enum(active, blocked, deleted) | |
| marketing_consent_at | timestamptz NULL | |
| deleted_at | timestamptz NULL | Soft delete → 30 kundan keyin anonimlashtirish |

### sessions
`id, user_id FK, token_hash UNIQUE, ip, user_agent, expires_at, revoked_at, created_at` — cookie'da faqat tasodifiy token, DB'da uning hashi.

### oauth_accounts
`id, user_id FK, provider, provider_account_id, UNIQUE(provider, provider_account_id)`.

### workspaces / workspace_members
- `workspaces`: `id, name, owner_user_id FK, tax_id (STIR) NULL, created_at`
- `workspace_members`: `workspace_id FK, user_id FK, role enum(owner, admin, member, viewer), PK(workspace_id, user_id)`

Multi-tenant izolyatsiya: workspace'ga tegishli har bir jadvalda `workspace_id` bor va har bir so‘rov repository qatlamida shu bo‘yicha filtrlanadi. Qo‘shimcha himoya — PostgreSQL Row Level Security (P3).

### roles / user_roles (admin RBAC)
`roles(id, code UNIQUE)`, `user_roles(user_id, role_id)`; ruxsatlar kodda rol → ruxsat xaritasi sifatida.

## 3. Billing

### plans
`id, code UNIQUE (free, plus, pro, business, enterprise), name_i18n jsonb, is_public bool, sort`

### plan_prices (versiyalangan narx)
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| plan_id | FK | |
| period | enum(month, year) | |
| amount_minor | bigint | 29 000 so‘m = 2 900 000 |
| currency | char(3) | `UZS` |
| effective_from | timestamptz | |
| effective_to | timestamptz NULL | |
| experiment_key | text NULL | A/B test |

### plan_entitlements
`plan_id FK, key text, value jsonb, PK(plan_id, key)` — masalan `("pro", "spell.ai_words_monthly", 100000)`.

### subscriptions
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| subject_type | enum(user, workspace) | |
| subject_id | uuid | |
| plan_id | FK | |
| plan_price_id | FK | Sotib olingan paytdagi narx |
| status | enum(trialing, active, past_due, canceled, expired) | |
| current_period_start / end | timestamptz | |
| cancel_at_period_end | bool | |
| provider | text NULL | |
| provider_token_ref | text NULL | Provayder karta tokeni (shifrlangan) |

Indeks: `UNIQUE(subject_type, subject_id) WHERE status IN ('trialing','active','past_due')` — bir vaqtda bitta faol obuna.

### subscription_events
`id, subscription_id FK, from_status, to_status, reason, actor_user_id NULL, created_at`.

### entitlement_overrides
`id, subject_type, subject_id, key, value jsonb, reason text NOT NULL, granted_by FK, expires_at NULL`.

### orders
`id, subject_type, subject_id, plan_price_id FK, amount_minor, currency, status enum(pending, paid, failed, canceled, refunded), idempotency_key UNIQUE, provider, created_at`.

### payments
`id, order_id FK, provider, provider_payment_id, amount_minor, fee_minor NULL, status enum(pending, succeeded, failed, refunded, chargeback), paid_at, UNIQUE(provider, provider_payment_id)`.

### payment_events (webhook xom yozuvlari)
`id, provider, provider_event_id, payload jsonb, signature_valid bool, processed_at NULL, error text NULL, UNIQUE(provider, provider_event_id)` — idempotentlik shu UNIQUE orqali.

### refunds
`id, payment_id FK, amount_minor, reason, status, created_by FK, provider_refund_id NULL`.

### invoices
`id, number text UNIQUE (INV-YYYY-NNNNNN), order_id FK, subject_type, subject_id, buyer_details jsonb (snapshot), lines jsonb, subtotal_minor, vat_minor, total_minor, currency, issued_at, pdf_object_key` — chiqarilgandan keyin o‘zgarmaydi.

### ledger_accounts / ledger_entries
- `ledger_accounts`: `id, code UNIQUE (cash_payme, revenue_subscription, revenue_cpc, revenue_affiliate, revenue_ads, revenue_api, expense_payment_fees, expense_ai, liability_refunds, …)`
- `ledger_entries`: `id, transaction_id uuid, account_id FK, direction enum(debit, credit), amount_minor, currency, source_type (payment, refund, conversion, campaign…), source_id, revenue_stream text, module text, created_at`

Invariant (test bilan tekshiriladi): har bir `transaction_id` bo‘yicha debet summasi = kredit summasi. Ledger yozuvlari o‘zgartirilmaydi va o‘chirilmaydi — faqat teskari yozuv.

## 4. Usage

### usage_counters
`subject_type, subject_id, key, period_start date, used bigint, PK(subject_type, subject_id, key, period_start)`.

### ai_usage_events
`id, user_id NULL, workspace_id NULL, feature (spell.grammar, spell.rewrite…), provider, model, input_tokens, output_tokens, cost_minor, plan_code, cache_hit bool, latency_ms, created_at` — matnning o‘zi saqlanmaydi.

### ai_cost_rates
`provider, model, input_per_million_minor, output_per_million_minor, currency, effective_from` — narx provayder sahifasidan qo‘lda kiritiladi.

### api_keys
`id, owner_type, owner_id, name, prefix text (ko‘rsatish uchun), key_hash text UNIQUE, scopes text[], last_used_at, revoked_at, created_at`.

### api_usage_events
`id, api_key_id FK, endpoint, status_code, duration_ms, created_at` — vaqt bo‘yicha partitsiyalangan (oylik).

## 5. Spell

- `dictionary_versions`: `id, version text UNIQUE, source_note, license_note, published_at, status`
- `dictionary_entries`: `id, version_id FK, lemma, script enum(latn, cyrl), pos, forms jsonb, flags jsonb` — indeks `(version_id, lemma)`
- `spell_feedback`: `id, user_id NULL, suggestion_type, source (dict/rule/ai), original_token, suggested_token, accepted bool, context_hash, dictionary_version_id, created_at` — to‘liq matn saqlanmaydi; foydalanuvchi roziligi bo‘lsa, qisqa kontekst oynasi.
- `documents`: `id, owner_type, owner_id, object_key, mime, size_bytes, sha256, status (uploaded, processing, ready, failed, deleted), expires_at` — saqlash muddati tugagach fayl o‘chiriladi.

## 6. Currency

- `currencies`: `code char(3) PK, numeric_code, name_i18n jsonb, nominal int`
- `official_rates`: `currency_code FK, rate_date date, rate NUMERIC(18,6), diff NUMERIC(18,6), nominal int, source text DEFAULT 'cbu', fetched_at, PK(currency_code, rate_date)`
- `banks`: `id, name, slug UNIQUE, logo_key, website, data_source_type (partner_feed, api, manual), data_permission_note text`
- `bank_rates`: `id, bank_id FK, currency_code FK, channel enum(branch, app, atm, online), buy NUMERIC(18,6), sell NUMERIC(18,6), observed_at, source_ref` — indeks `(currency_code, observed_at DESC)`
- `rate_alerts`: `id, user_id FK, currency_code, rate_type (official, bank_best_buy, bank_best_sell), condition (gte, lte), threshold NUMERIC(18,6), channel (email, telegram), active bool, last_triggered_at`

CBU `Date` (`DD.MM.YYYY`) importda `date` turiga o‘giriladi; `Rate` satri `NUMERIC` ga.

## 7. Calc

### tax_rules
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| key | text | `pit_rate`, `vat_rate`, `social_tax_rate`, `min_wage`, `bhm`, `inps_employee_rate`, `turnover_tax_rate`… |
| value | jsonb | Son yoki strukturali (masalan, shkala) |
| effective_from | date | |
| effective_to | date NULL | |
| legal_basis | text NOT NULL | Hujjat nomi, raqami, moddasi |
| source_url | text NOT NULL | |
| status | enum(draft, reviewed, approved, retired) | |
| created_by / reviewed_by / approved_by | FK | `approved_by ≠ created_by` CHECK |
| approved_at | timestamptz | |
| version | int | |

Exclusion constraint: bitta `key` uchun `approved` holatdagi `effective` oraliqlari kesishmaydi.

### saved_calculations
`id, owner_type, owner_id, calculator, inputs jsonb, outputs jsonb, tax_rule_ids uuid[], calc_engine_version text, title, created_at` — natija qaysi qoidalar va qaysi kod versiyasi bilan hisoblanganini saqlaydi.

## 8. Prices

- `categories`: `id, parent_id NULL, slug UNIQUE, name_i18n`
- `brands`: `id, slug UNIQUE, name`
- `products`: `id, category_id FK, brand_id FK, model text, slug UNIQUE, specs jsonb, images jsonb, status (draft, active, hidden)`
- `product_variants`: `id, product_id FK, attributes jsonb (ram, storage, color, region), gtin NULL, mpn NULL, UNIQUE(product_id, attributes_hash)`
- `merchants`: `id, name, slug UNIQUE, website, status (applied, approved, suspended), trust jsonb (official_dealer, warranty, delivery), commission_config jsonb, contract_ref`
- `merchant_feeds`: `id, merchant_id FK, format (csv, xml, json), url_or_upload, schedule, last_run_at, last_status, last_error`
- `offers`: `id, merchant_id FK, variant_id FK NULL, merchant_sku, title_raw, url, price_minor, currency, in_stock bool, last_seen_at, is_sponsored bool, match_confidence NUMERIC(4,3)` — `variant_id` NULL bo‘lsa ommaga ko‘rsatilmaydi.
- `price_history`: `offer_id FK, observed_at, price_minor, in_stock` — oylik partitsiya.
- `match_candidates`: `id, offer_id FK, variant_id FK, score, status (pending, accepted, rejected), reviewed_by NULL`
- `clicks`: `id (click_id), offer_id FK, merchant_id, user_id NULL, session_hash, ip_hash, ua_hash, referer_path, is_valid bool, invalid_reason NULL, created_at`
- `conversions`: `id, click_id FK NULL, merchant_id FK, external_order_id, amount_minor, commission_minor, status (pending, approved, rejected, reversed), occurred_at, UNIQUE(merchant_id, external_order_id)`
- `price_alerts`: `id, user_id FK, variant_id FK, target_price_minor, active, last_triggered_at`

IP va user-agent xom holatda emas, kunlik tuz (salt) bilan hash qilinib saqlanadi.

## 9. Ads

- `advertisers`: `id, name, contact, legal_details jsonb, status`
- `campaigns`: `id, advertiser_id FK, type (banner, sponsored_offer, sponsored_bank, sponsored_category), pricing (cpm, cpc, flat), budget_minor, spent_minor, start_at, end_at, targeting jsonb, status (draft, in_review, approved, running, paused, finished, rejected)`
- `placements`: `id, code UNIQUE (home_top, currency_sidebar…), module, max_per_page`
- `creatives`: `id, campaign_id FK, language, asset_key, text, url, review_status, reviewed_by`
- `ad_impressions` / `ad_clicks`: `id, campaign_id, creative_id, placement_id, session_hash, is_valid, created_at` — agregatlanib, xom yozuvlar 90 kundan keyin o‘chiriladi.

## 10. Platform

- `audit_logs`: `id, actor_user_id, actor_role, action, entity_type, entity_id, before jsonb, after jsonb, ip_hash, created_at` — faqat INSERT ruxsati (DB roli darajasida).
- `feature_flags`: `key PK, enabled, rules jsonb, updated_by, updated_at`
- `notifications`: `id, user_id, channel, template, payload, status, sent_at, error`
- `analytics_events`: `id, anon_id, user_id NULL, name, module, props jsonb, created_at` — partitsiya; shaxsiy ma’lumot props'ga yozilmaydi.

## 11. Ma’lumot saqlash muddatlari [FARAZ — yurist bilan TEKSHIR]

| Ma’lumot | Muddat |
|---|---|
| Yuklangan hujjatlar (DOCX) | 24 soat (Free), 30 kun (Pro) yoki foydalanuvchi o‘chirguncha |
| Imlo tekshiruv matni | Saqlanmaydi (faqat qayta ishlash vaqtida xotirada) |
| Xom bosish/ko‘rish voqealari | 90 kun, keyin agregat |
| Ledger, hisob-faktura, to‘lovlar | Buxgalteriya qonunchiligi talab qilgan muddat [TEKSHIR] |
| Audit log | Kamida 1 yil |
| O‘chirilgan akkaunt | 30 kun soft delete, keyin anonimlashtirish (moliyaviy yozuvlar bundan mustasno) |
