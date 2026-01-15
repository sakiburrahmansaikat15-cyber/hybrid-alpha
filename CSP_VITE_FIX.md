# 🔧 CSP (Content Security Policy) Fix for Vite Dev Server

## ✅ Issue Fixed

**Problem**: The strict Content Security Policy was blocking Vite development server resources.

**Error Messages**:
```
Loading the script 'http://[::1]:5174/@vite/client' violates the following Content Security Policy directive
Loading the stylesheet 'http://[::1]:5174/resources/css/app.css' violates the following Content Security Policy directive
```

## 🛠️ Solution Implemented

Updated `app/Http/Middleware/SecurityHeaders.php` to use **environment-aware CSP**:

### Development Mode (APP_ENV=local or APP_DEBUG=true)
- ✅ Allows Vite dev server on all localhost variants:
  - `http://localhost:5173` and `http://localhost:5174`
  - `http://[::1]:5173` and `http://[::1]:5174` (IPv6)
  - `http://127.0.0.1:5173` and `http://127.0.0.1:5174`
- ✅ Allows WebSocket connections for Hot Module Replacement (HMR)
- ✅ Allows `unsafe-inline` and `unsafe-eval` for development tools

### Production Mode (APP_ENV=production)
- 🔒 Strict CSP without Vite URLs
- 🔒 No `unsafe-eval` allowed
- 🔒 Only allows resources from same origin

## 📋 What's Allowed in Development

| Resource Type | Allowed Sources |
|---------------|----------------|
| Scripts | `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, Vite dev server |
| Styles | `'self'`, `'unsafe-inline'`, Vite dev server |
| Images | `'self'`, `data:`, `https:`, `blob:` |
| Fonts | `'self'`, `data:`, Vite dev server |
| Connections | `'self'`, Vite dev server, WebSocket (ws://) |
| Workers | `'self'`, `blob:` |

## 🔒 What's Allowed in Production

| Resource Type | Allowed Sources |
|---------------|----------------|
| Scripts | `'self'`, `'unsafe-inline'` only |
| Styles | `'self'`, `'unsafe-inline'` only |
| Images | `'self'`, `data:`, `https:` |
| Fonts | `'self'`, `data:` |
| Connections | `'self'` only |
| Workers | `'self'`, `blob:` |

## 🧪 Testing

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check console** - No more CSP errors
3. **Verify Vite HMR** - Changes should hot-reload

## ⚙️ Configuration (Optional)

You can customize Vite URLs in `.env`:

```env
# Optional: Custom Vite dev server URL
VITE_URL="http://localhost:5173 http://localhost:5174"
```

Then update `config/app.php`:

```php
'vite_url' => env('VITE_URL', 'http://localhost:5173 http://localhost:5174'),
```

## 🔍 How It Works

The middleware checks the environment:

```php
if (config('app.env') === 'local' || config('app.debug')) {
    // Permissive CSP for development
} else {
    // Strict CSP for production
}
```

## ✅ Benefits

1. **Development**: Full Vite functionality with HMR
2. **Production**: Maximum security with strict CSP
3. **Automatic**: Switches based on environment
4. **Secure**: No manual CSP management needed

## 🚨 Important Notes

- ⚠️ **Never** set `APP_DEBUG=true` in production
- ⚠️ **Never** set `APP_ENV=local` in production
- ✅ Always test in production-like environment before deploying
- ✅ CSP errors in production are **intentional** - they protect your app

## 🔧 Troubleshooting

### Still seeing CSP errors?

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Clear Laravel cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```
4. **Restart Vite dev server**:
   ```bash
   npm run dev
   ```

### Vite running on different port?

Update the `$viteUrl` in `SecurityHeaders.php` to include your port:

```php
$viteUrl = config('app.vite_url', 'http://localhost:YOUR_PORT http://[::1]:YOUR_PORT');
```

## 📚 Related Files

- `app/Http/Middleware/SecurityHeaders.php` - CSP implementation
- `app/Http/Kernel.php` - Middleware registration
- `.env` - Environment configuration

---

**Status**: ✅ **FIXED**  
**Date**: 2026-01-07  
**Impact**: Development experience improved, production security maintained
