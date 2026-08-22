# ✈️ پرواز ۷۲۴ — سایت فروش بلیط هواپیما

یک وب‌اپلیکیشن نمونه‌ی خرید بلیط هواپیما با **Angular 21**، **RxJS** و **Tailwind CSS** + **daisyUI** (رابط فارسی و راست‌به‌چپ).

## ✨ امکانات

- **جستجوی پرواز** — مبدا/مقصد، تاریخ رفت و برگشت، تعداد مسافر و کابین (اکونومی/بیزینس)
- **صفحه نتایج** — فیلتر بر اساس ایرلاین، قیمت، توقف و بازه‌ی زمانی + مرتب‌سازی (ارزان‌ترین، سریع‌ترین، زودترین) — همه با **آپراتورهای RxJS** (`combineLatest`، `switchMap`، `debounceTime`، `shareReplay`)
- **جریان رفت و برگشت** — انتخاب بلیت رفت، سپس برگشت، با بنر خلاصه و امکان تغییر
- **صفحه رزرو** — فرم Reactive برای هر مسافر با اعتبارسنجی کد ملی و موبایل، محاسبه‌ی زنده‌ی مبلغ با RxJS
- **صفحه تأیید** — بلیط چاپ‌شونده با بارکد، کد رزرو و جمع مبلغ
- **بک‌اند واقعی Laravel** — جستجوی پرواز، فرودگاه‌ها و ثبت/دریافت رزرو از API (`/api/v1`)

## 🔌 API بک‌اند (Laravel)

| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/v1/airports` | فهرست فرودگاه‌ها (از دیتابیس، سیدر شده) |
| GET | `/api/v1/flights/search` | جستجوی پرواز (`from`، `to`، `date`، `cabinClass`) |
| POST | `/api/v1/bookings` | ثبت رزرو (پروازها + مسافران) |
| GET | `/api/v1/bookings/{ref}` | دریافت رزرو با کد |

## 🐘 دیتابیس PostgreSQL (Neon)

پروژه با PostgreSQL روی [Neon](https://console.neon.tech/) کار می‌کند. بک‌اند روی Render دیپلوی می‌شود.

### تنظیم لوکال

در `backend/.env` این مقادیر را قرار دهید (credential واقعی را commit نکنید):

```dotenv
APP_ENV=production
APP_DEBUG=false
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
DB_CONNECTION=pgsql
DB_SSLMODE=require
NEON_ENDPOINT_ID=ep-example
```

`DATABASE_URL` از Neon خوانده می‌شود. `NEON_ENDPOINT_ID` برای libpq قدیمی (مثل XAMPP) لازم است.

## 🚀 اجرا

### Render (Docker — production)

1. در [Render Dashboard](https://dashboard.render.com/) یک **Web Service** جدید با Runtime **Docker** بسازید.
2. **Root Directory** را `backend` بگذارید.
3. **Health Check Path**: `/up`
4. متغیرهای محیطی را تنظیم کنید:

| کلید | مقدار |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | آدرس نهایی سرویس (مثلاً `https://xxx.onrender.com`) |
| `LOG_CHANNEL` | `stderr` |
| `DB_CONNECTION` | `pgsql` |
| `DB_SSLMODE` | `require` |
| `DATABASE_URL` | رشته‌ی اتصال Neon |
| `NEON_ENDPOINT_ID` | شناسه endpoint نئون (اختیاری؛ برای libpq قدیمی) |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` |

5. دکمه‌ی **Create Web Service** را بزنید. Render پروژه را با Docker بیلد و با Nginx+PHP-FPM اجرا می‌کند.
6. `migrate --seed` به‌صورت خودکار هنگام استارت اجرا می‌شود و فرودگاه‌ها را seed می‌کند.

API نهایی در `https://your-service.onrender.com/api/v1/...` قابل دسترس خواهد بود.

### لوکال (توسعه)

```bash
# ۱) بک‌اند Laravel (پورت ۸۰۰۰)
composer install
php artisan migrate --seed   # ساخت جدول‌ها + سیدر فرودگاه‌ها
php artisan serve            # http://127.0.0.1:8000

# ۲) فرانت Angular (پورت ۴۲۰۰)
cd flight-tickets
npm install
npm start        # http://localhost:4200
```

فرانت از طریق پروکسی dev-server (`proxy.conf.json`) به بک‌اند وصل می‌شود: مسیرهای `/api/*` به `http://127.0.0.1:8000` ارسال می‌شوند، پس نیازی به تنظیم CORS در توسعه نیست.

## 🧪 تست و بیلد

```bash
npm test         # اجرای تست‌های واحد (Vitest)
npm run build    # بیلد production در dist/
```

## 🧱 ساختار

```
src/app/
├── components/        # header، footer، flight-card، search-form
├── pages/             # home، results، booking، confirmation
├── services/          # flight (API)، search-state، booking (API)
├── models/            # تایپ‌های دامنه (Flight، SearchQuery، Passenger…)
└── utils/             # فرمت فارسی اعداد/تاریخ/زمان و فیلتر خالص پروازها
```

## 🎨 دیزاین سیستم

- **[daisyUI](https://github.com/saadeghi/daisyui)** — محبوب‌ترین کتابخانه‌ی کامپوننت Tailwind روی گیت‌هاب (~۴۰k ستاره)، با تم `winter`
- **[Tailwind CSS v4](https://tailwindcss.com)** — پیکربندی CSS-first
- **[Vazirmatn](https://github.com/rastikerdar/vazirmatn)** — فونت فارسی

## 🧭 مدیریت State با RxJS

- `SearchStateService` — `BehaviorSubject<SearchQuery>` برای اشتراک جستجو بین صفحات
- `BookingService` — `BehaviorSubject` برای بلیط‌های انتخاب‌شده و رزرو نهایی
- `ResultsPage` — خط لوله‌ی `switchMap → combineLatest → applyFilters` برای فیلتر/مرتب‌سازی واکنش‌گرا
- `BookingPage` — `combineLatest(form.valueChanges, unitPrice)` برای مبلغ زنده
