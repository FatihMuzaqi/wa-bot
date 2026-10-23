# WhatsApp Automation & AI Bot Platform Backend

Database schema backend untuk Node.js, Express.js, MySQL, Sequelize ORM, JWT, Socket.IO, Evolution API, dan ES modules.

## Setup

1. Copy `.env.example` ke `.env`.
2. Isi konfigurasi MySQL.
3. Install dependencies:

```bash
npm install
```

4. Jalankan migration:

```bash
npm run db:migrate
```

## Struktur

- `src/config/database.js`: konfigurasi Sequelize/MySQL.
- `src/database/migrations`: migration schema lengkap.
- `src/database/models`: model Sequelize per entity.
- `src/database/models/index.js`: inisialisasi model dan associations.
- `src/database/migrator.js`: runner migration berbasis Umzug untuk ES modules.

## Form Submission Operations

Admin dapat mengelola hasil form melalui endpoint berikut:

- `GET /api/forms/submissions`: daftar, pencarian, filter, dan pagination.
- `GET /api/forms/submissions/export`: export hasil dalam CSV.
- `GET /api/forms/submissions/:submissionId`: detail kontak dan seluruh jawaban.
- `PATCH /api/forms/submissions/:submissionId`: ubah `operationalStatus` dan `notes`.
- `POST /api/forms/submissions/:submissionId/forward`: kirim hasil ke webhook eksternal.

Jalankan `npm run db:migrate` setelah deployment untuk menambahkan kolom operasional.
Konfigurasi tujuan penerusan melalui `FORM_SUBMISSION_WEBHOOK_URL`. Token opsional pada
`FORM_SUBMISSION_WEBHOOK_TOKEN` akan dikirim sebagai Bearer token.
