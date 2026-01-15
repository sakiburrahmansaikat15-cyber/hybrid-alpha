<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    public static function bootLogsActivity()
    {
        static::created(function ($model) {
            static::logActivity($model, 'created');
        });

        static::updated(function ($model) {
            static::logActivity($model, 'updated');
        });

        static::deleted(function ($model) {
            static::logActivity($model, 'deleted');
        });
    }

    protected static function logActivity($model, $action)
    {
        $details = [];

        if ($action === 'updated') {
            $details = [
                'old' => array_intersect_key($model->getOriginal(), $model->getDirty()),
                'new' => $model->getDirty(),
            ];

            // Don't log if sensitive fields are the only ones changed (like password)
            if (isset($details['new']['password'])) {
                $details['new']['password'] = '********';
            }
            if (isset($details['old']['password'])) {
                $details['old']['password'] = '********';
            }
        } elseif ($action === 'created') {
            $details = $model->toArray();
            if (isset($details['password'])) {
                $details['password'] = '********';
            }
        } else {
            $details = $model->toArray();
        }

        AuditLog::log(
            $action,
            strtolower(class_basename($model)),
            $model->id,
            $details
        );
    }
}
