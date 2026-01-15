<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'target_id',
        'details',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($action, $module, $target_id = null, $details = null)
    {
        try {
            self::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'module' => $module,
                'target_id' => $target_id,
                'details' => $details,
                'ip_address' => Request::ip(),
                'user_agent' => Request::header('User-Agent'),
            ]);
        } catch (\Exception $e) {
            // Silently fail logging to not disrupt app flow, or log to file
            \Illuminate\Support\Facades\Log::error('Audit Log Error: ' . $e->getMessage());
        }
    }
}
