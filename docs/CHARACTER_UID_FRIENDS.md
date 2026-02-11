# Character UID + Friend by UID (Cloudflare D1)

Implementasi ini memastikan setiap karakter (bukan akun) punya UID integer unik global dari D1 (`AUTOINCREMENT`, mulai dari 1).

## Endpoint baru

- `POST /api/friends-request`
- `POST /api/friends-respond`
- `GET /api/friends-list?characterUid=<uid>`

## Perubahan alur save/load

- `POST /api/save`
  - Jika payload profil (`{ slots, activeSlot }`), backend akan sinkronkan slot -> tabel `characters`.
  - UID karakter ditetapkan server dari DB, bukan dari client.
- `GET /api/load`
  - Backend menyisipkan field `uid` ke slot karakter berdasarkan data `characters`.

## SQL final untuk eksekusi migration

Jalankan ini sekali di environment target:

```bash
npx wrangler d1 execute <DB_NAME> --remote --file=schema.sql
```

Atau eksekusi blok SQL berikut secara manual:

```sql
CREATE TABLE IF NOT EXISTS characters (
  uid INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, slot_index),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);

CREATE TABLE IF NOT EXISTS character_friends (
  id TEXT PRIMARY KEY,
  requester_uid INTEGER NOT NULL,
  addressee_uid INTEGER NOT NULL,
  uid_low INTEGER NOT NULL,
  uid_high INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected','blocked')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(uid_low, uid_high),
  FOREIGN KEY (requester_uid) REFERENCES characters(uid) ON DELETE CASCADE,
  FOREIGN KEY (addressee_uid) REFERENCES characters(uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_character_friends_req ON character_friends(requester_uid, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_friends_add ON character_friends(addressee_uid, status, updated_at DESC);
```

## Troubleshooting login PBKDF2 di Cloudflare

Jika muncul error terkait iterasi PBKDF2 (contoh: `iteration counts above 100000 are not supported`), gunakan iterasi `100000` pada implementasi auth backend.
