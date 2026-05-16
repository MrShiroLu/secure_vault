# Secure Vault

Bilgi Güvenliği ve Kriptoloji dersi için hazırlanmış, kişisel verileri (IBAN, kredi kartı, TC kimlik, e-posta, telefon) şifreli olarak saklayan bir web uygulaması. Kullanıcı kayıt olurken kendisine ait bir RSA anahtar çifti üretilir; kasaya eklenen her kayıt önce simetrik olarak şifrelenir, simetrik anahtar da kullanıcının açık anahtarıyla sarmalanır. Kayıtlar dijital olarak imzalanabilir, imzalı kayıtlar süreli bir bağlantı ile üçüncü kişilerle paylaşılabilir.

## Mimari

İki bileşenden oluşuyor:

- `backend/` - Flask tabanlı REST API. SQLite üzerinde çalışıyor, isteğe bağlı olarak `DATABASE_URL` ile değiştirilebiliyor.
- `frontend/` - React 19 + TypeScript + Vite. API ile JWT taşıyan `Authorization` başlığı üzerinden konuşuyor.

Frontend 5173, backend 5000 portunda çalışıyor. CORS yalnızca frontend origin'ine açık.

## Kullanılan Kripto Yapıları

Tasarım klasik hibrit şifrelemeyi takip ediyor. Her vault kaydı için:

1. 32 byte'lık rastgele bir AES-256 anahtarı üretilir.
2. Veri, **AES-256-GCM** ile şifrelenir. 12 byte'lık IV her şifrelemede yenilenir, 16 byte'lık doğrulama etiketi ayrıca saklanır.
3. Şifreli metnin **SHA-256** özeti alınır ve bütünlük kontrolü için veritabanına yazılır.
4. AES anahtarı, kullanıcının **RSA-2048** açık anahtarıyla **OAEP (SHA-256)** dolgusu kullanılarak şifrelenir.

Çözümleme tersine işletiliyor: RSA özel anahtarı ile AES anahtarı geri alınıyor, SHA-256 yeniden hesaplanıp veritabanındaki ile karşılaştırılıyor, eşleşme varsa AES-GCM ile çözülüp düz metin döndürülüyor. Özetler uyuşmazsa 409 dönüyor; bu kurcalama tespitini sağlıyor.

İmzalama için **RSA + PKCS#1 v1.5** ve SHA-256 kullanılıyor. İmza, düz metnin değil ciphertext'in özeti üzerinde alınıyor; bu sayede özel anahtara erişmeden imza yenilemek mümkün olmuyor.

Parolalar **bcrypt** (12 round) ile saklanıyor. Oturum yönetimi **JWT (HS256)** üzerinden, token ömrü 24 saat.

## Veri Maskeleme

Liste ekranında hassas alanlar açık gösterilmiyor. Maskeleme şu kurallarla yapılıyor:

- IBAN: ilk 4 + son 2 karakter görünür, arası `*`
- Kredi kartı: yalnızca son 4 hane
- TC kimlik: tamamen maskelenir
- E-posta: ilk 2 karakter + domain
- Telefon: önek + son 2 hane

Asıl veriyi görmek için kayıt detayına girip "göster" demek gerekiyor; bu istek backend'de yeni bir çözümleme tetikliyor.

## Paylaşım

İmzalanmış bir kayıt için tek seferlik bir token (UUID) üretilebiliyor. Token 24 saat geçerli, doğrulama uç noktası kimlik doğrulaması istemiyor. Süresi dolan tokenlar APScheduler ile günde bir temizleniyor.

## Klasör Yapısı

```
backend/
  app.py              # Flask app + blueprint kayıtları
  crypto.py           # AES-GCM, RSA, SHA-256, imzalama
  auth.py             # bcrypt, JWT, alan doğrulama
  models.py           # User, VaultItem, ShareToken
  middleware.py       # @jwt_required decorator
  scheduler.py        # token temizleme görevi
  routes/
    auth_routes.py
    vault_routes.py
frontend/
  src/
    pages/            # Login, Register, Vault, Detail, Add, Verify
    lib/              # api, auth, vaultApi, validators
    components/       # AuthForm, ProtectedRoute, Toast, ...
tests/
  test_crypto.py      # hibrit akış ve kurcalama testleri
  test_signing.py     # imza doğrulama senaryoları
run-dev.sh
```

## Çalıştırma

Backend bağımlılıkları için sanal ortam tavsiye ediliyor:

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # JWT_SECRET ayarla
```

Frontend tarafında:

```sh
cd frontend
npm install
```

İkisini birden ayağa kaldırmak için kök dizindeki betik kullanılabilir:

```sh
./run-dev.sh
```

Backend `http://localhost:5000`, frontend `http://localhost:5173` adresinden açılıyor.

## Testler

Kripto katmanı `unittest` ile test ediliyor:

```sh
cd tests
python -m unittest discover
```
