# Full Online RPG dengan Cloudflare (tanpa Coop dulu)

Dokumen ini jadi checklist implementasi tugas 1-6 agar game berpindah dari client-trusted ke server-authoritative.

## 1) Server authoritative battle

- Endpoint baru:
  - `POST /api/battle-start`
  - `POST /api/battle-action`
  - `GET /api/battle-state`
- State battle aktif disimpan di tabel `active_battles`.
- Semua hitungan combat dilakukan di backend (`functions/game-engine.js`).

## 2) Cloud save jadi sumber utama

- Save/load wajib melalui:
  - `POST /api/save`
  - `GET /api/load`
- Save disimpan di tabel `saves` dengan field `version` dan `updated_at`.

## 3) Validasi payload + progression rules

- Validasi schema save ada di `functions/game-save.js`.
- Rule anti-tamper:
  - level tidak boleh turun
  - kenaikan gold/xp dibatasi per perubahan save

## 4) Auth hardening

- Register memakai `PBKDF2-SHA256` iterasi tinggi.
- Login mendukung verifikasi legacy hash lalu auto-upgrade ke PBKDF2 saat login sukses.
- Session cookie tetap `HttpOnly + Secure + SameSite`.

## 5) Hardening API

- Rate-limit sederhana via tabel `api_rate_limits`.
- Idempotency key untuk endpoint save (`idempotency_keys`).
- Security event log untuk audit (`security_events`).

## 6) Rollout bertahap di Cloudflare

1. Jalankan migration `schema.sql` pada D1.
2. Deploy Functions ke Cloudflare Pages.
3. Uji alur register/login/save/load.
4. Uji battle endpoint full server-authoritative.
5. Matikan jalur old client-authoritative secara bertahap di frontend.
6. Monitor `security_events` dan tuning rate-limit sesuai trafik.

## Contoh command deployment

```bash
npx wrangler d1 execute <DB_NAME> --file=schema.sql --remote
npx wrangler pages deploy .
```

## Catatan integrasi frontend (phase berikutnya)

- Frontend perlu dipindah ke mode thin-client:
  - tombol battle kirim intent ke `/api/battle-action`
  - UI hanya merender state dari backend
- Local storage hanya cache UI, bukan source of truth gameplay.
