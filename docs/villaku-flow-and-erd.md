# Villaku — Flowchart, ERD, dan Penjelasan Fitur

Dokumen ini menjelaskan alur sistem Villaku berdasarkan route aplikasi, RBAC, dan `prisma/schema.prisma` saat ini.

## File diagram

- `villaku-system-flow.drawio`
  - **01 — End to End Booking:** alur customer, API/database, dan admin operations.
  - **02 — Role and Feature Access:** proses login satu form, session, permission guard, dan akses setiap role.
  - **03 — Notification Flow:** sumber event, penyimpanan, audience role, status baca/arsip, dan deep-link aksi.
- `villaku-erd.drawio`
  - **01 — Core Booking and Payment:** booking, kalender, kupon, pembayaran, refund, invoice context, dan notifikasi.
  - **02 — Villa Catalog and Pricing:** villa, kategori, fasilitas, gambar, seasonal rate, availability, dan promosi.
  - **03 — Identity RBAC and Engagement:** user, role, permission, wishlist, review, dan audit operasional.

Kedua file dapat dibuka melalui **diagrams.net / Draw.io → File → Open From → Device**.

## Alur utama customer

1. Customer membuka landing page dan menjelajahi villa unggulan.
2. Customer melakukan pencarian berdasarkan lokasi, tanggal, dan jumlah tamu.
3. Sistem memeriksa `VillaAvailability`, kapasitas, minimum stay, dan rate yang berlaku.
4. Customer membuka detail villa untuk melihat galeri, fasilitas, lokasi, harga, dan ketersediaan.
5. Saat melanjutkan booking, customer login atau registrasi melalui form autentikasi yang sama.
6. Sistem menghitung quote dari harga malam, seasonal rate, extra guest, add-on, kupon, service fee, dan pajak.
7. Kalender villa di-hold sementara agar tanggal yang sama tidak dipesan dua kali.
8. Sistem membuat `Booking`, `BookingLineItem`, serta kode booking unik.
9. Customer memilih pembayaran gateway atau transfer manual.
10. Pembayaran berhasil mengubah status booking, memblokir kalender, membuat histori, dan mengirim notifikasi.
11. Customer melihat status pembayaran, invoice PDF, daftar booking, wishlist, notifikasi, dan form ulasan di dashboard.

## Status penting

### Booking

`DRAFT → PENDING_PAYMENT → PAYMENT_REVIEW → CONFIRMED → CHECKED_IN → COMPLETED`

Jalur alternatif:

- Booking kedaluwarsa: `PENDING_PAYMENT → EXPIRED`.
- Pembatalan: status aktif → `CANCELLED`.
- Semua perpindahan penting dicatat di `BookingStatusHistory` beserta aktornya.

### Pembayaran

- Gateway: membuat `Payment`, menunggu callback/webhook, lalu menjadi sukses atau gagal.
- Transfer manual: customer mengunggah `PaymentProof`, Finance memverifikasi atau menolak bukti.
- Refund: dibuat pada `Refund`, menyimpan pemohon, pemroses, nominal, alasan, dan status proses.
- Event provider disimpan pada `PaymentEvent` agar callback dapat diaudit dan tidak diproses ganda.

### Notifikasi

1. Event booking, pembayaran, ulasan, tamu, kalender, atau cron memanggil notification trigger.
2. Sistem membentuk kategori, prioritas, penerima, dan action URL.
3. `deduplicationKey` mencegah event yang sama menghasilkan notifikasi ganda.
4. Notifikasi ditargetkan melalui `userId`, email, atau role.
5. Inbox menampilkan item sesuai hak akses role.
6. Pengguna dapat mencari, memfilter, memilih semua, menandai dibaca, mengarsipkan, atau membuka modul terkait.
7. Tombol aksi membuka record booking, pembayaran, villa, ulasan, atau customer yang sesuai.

## Hak akses role

| Role | Fungsi utama | Modul yang dapat diakses |
|---|---|---|
| **Super Admin** | Pemilik kontrol tertinggi | Semua fitur, pengguna, role, dan permission |
| **Admin** | Pengelola operasional umum | Semua modul operasional dan pengguna; tidak mengubah master role/permission |
| **Receptionist** | Front desk dan kebutuhan tamu | Overview, Booking lihat/ubah, Villa lihat, Customer lihat, notifikasi terkait |
| **Finance** | Pembayaran dan rekonsiliasi | Overview, Booking lihat, Pembayaran kelola, Refund, Laporan, notifikasi keuangan |
| **Marketing** | Konten, reputasi, dan analitik | Overview, Villa lihat, Customer lihat, Ulasan moderasi, Laporan, notifikasi marketing |
| **Customer/User** | Pemesan villa | Dashboard pribadi, profil, booking, pembayaran, invoice, wishlist, notifikasi, ulasan |

Permission diperiksa dua kali:

- UI menyembunyikan menu dan tombol yang tidak boleh digunakan.
- Proxy/API memvalidasi token, role, route, dan HTTP method. Akses tidak sah menghasilkan `403` atau redirect.

## Penjelasan fitur customer

### 1. Landing dan pencarian villa

- Hero premium, CTA, statistik, gallery, testimonial, FAQ, dan dark/light mode.
- Pencarian berdasarkan lokasi, tanggal, kapasitas, dan rentang harga.
- Availability dan harga dihitung berdasarkan tanggal, bukan hanya harga dasar villa.

### 2. Detail villa

- Galeri, fasilitas, kapasitas, kamar, lokasi, deskripsi, rating, dan harga.
- Pemeriksaan ketersediaan serta quote sebelum membuat booking.
- Wishlist untuk menyimpan villa ke akun customer.

### 3. Autentikasi dan profil

- Login user dan staff menggunakan satu form.
- Registrasi customer, verifikasi email, lupa password, dan reset password.
- JWT cookie/session menentukan tujuan halaman dan hak akses.

### 4. Booking

- Data tamu, tanggal menginap, jumlah tamu, special request, dan kupon.
- Ringkasan subtotal, diskon, pajak, service fee, deposit, dan sisa pembayaran.
- Kalender di-lock selama proses pembayaran.

### 5. Pembayaran dan invoice

- Mendukung payment gateway dan transfer manual.
- Upload bukti transfer, status pembayaran, retry bila gagal, dan refund.
- Invoice PDF dapat diunduh dari booking terkait.

### 6. Dashboard customer

- Riwayat dan status booking.
- Notifikasi akun.
- Wishlist villa.
- Akses pembayaran dan invoice.
- Penulisan ulasan setelah stay selesai.

## Penjelasan fitur admin

### 1. Overview

- KPI booking, revenue, okupansi, customer, pembayaran, dan aktivitas terbaru.
- Menjadi halaman ringkasan lintas modul sesuai role.

### 2. Booking

- Cari dan filter booking.
- Buka detail berdasarkan kode booking.
- Tinjau data tamu, villa, tanggal, pembayaran, dan catatan.
- Ubah status booking dan simpan histori perubahan.
- Unduh invoice serta ekspor daftar booking.

### 3. Villa

- Daftar, grid/table view, pencarian, filter lokasi/status, dan sorting.
- Tambah/edit villa, kategori, fasilitas, harga, status publikasi, dan featured state.
- Kelola gallery, cover image, availability, blok kalender, serta seasonal rate.
- Promosi dapat berlaku untuk semua villa atau villa tertentu.

### 4. Pembayaran

- Daftar transaksi dan status rekonsiliasi.
- Verifikasi atau tolak bukti transfer manual.
- Lihat event gateway dan histori pembayaran.
- Proses refund dan catat pihak yang meminta/memproses.

### 5. Customer

- Cari customer berdasarkan nama, email, telepon, atau negara.
- Lihat tier, total booking, total malam, nilai transaksi, dan stay berikutnya.
- Ekspor data customer untuk kebutuhan operasional atau marketing.

### 6. Ulasan

- Filter review pending, published, hidden, atau flagged.
- Publikasikan, sembunyikan, tandai featured, moderasi, atau hapus ulasan.
- Menyimpan catatan dan waktu moderasi.

### 7. Notifikasi

- Filter Semua, Belum Dibaca, Perlu Tindakan, Booking, Pembayaran, Ulasan, Tamu, dan Sistem.
- Search, select all, tandai dibaca, arsipkan, dan badge dinamis.
- Isi inbox dibatasi berdasarkan role.
- Action button mengarah langsung ke record yang perlu ditangani.

### 8. Laporan

- Revenue dan performa booking berdasarkan periode.
- Filter laporan dan ekspor file untuk analisis lanjutan.
- Hanya role dengan permission laporan yang dapat mengaksesnya.

### 9. Pengguna dan role

- Tambah pengguna, ubah role, status akun, dan detail profil staff.
- Status akun: Active, Invited, Suspended, atau Deactivated.
- `AccessRole`, `Permission`, `RolePermission`, dan `UserAccessRole` mendukung RBAC dinamis.

### 10. Pengaturan dan konten

- Identitas website, kontak, konfigurasi umum, dan integrasi maps.
- Kelola FAQ dan blog.
- Nilai konfigurasi disimpan dalam `WebsiteSetting` berbentuk JSON dan dikelompokkan per fitur.

## Ringkasan relasi ERD

- Satu `Category` memiliki banyak `Villa`.
- `Villa` dan `Amenity` berelasi many-to-many melalui `VillaAmenity`.
- `Villa` dan `Promotion` berelasi many-to-many melalui `VillaPromotion`.
- Satu `Villa` memiliki banyak gambar, rate, tanggal availability, booking, wishlist, dan review.
- Satu `User` dapat memiliki banyak booking, wishlist, review, notifikasi, serta aktivitas operasional.
- Satu `Booking` dimiliki maksimal satu user tetapi tetap menyimpan guest fields untuk guest snapshot.
- Satu `Booking` memiliki banyak line item, payment, status history, notification, dan availability lock.
- Satu `Coupon` dapat dipakai banyak booking; pemakaian dicatat pada `CouponRedemption`.
- Satu `Payment` memiliki banyak proof, provider event, dan refund.
- `AccessRole` dan `Permission` berelasi many-to-many melalui `RolePermission`.
- `User` dan `AccessRole` berelasi many-to-many melalui `UserAccessRole`, termasuk siapa pemberi role dan masa berlakunya.

## Legenda diagram

- **PK**: primary key.
- **FK**: foreign key.
- **1 / N**: one-to-many.
- **0..1**: relasi opsional.
- Hijau: customer/domain utama atau proses berhasil.
- Biru: sistem/API dan data operasional.
- Emas: keputusan, pembayaran, pricing, atau admin operation.
- Ungu/merah muda: role, permission, promosi, dan engagement.
- Merah: error, refund, atau jalur penolakan.
