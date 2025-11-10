<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    protected $fillable = [
        'name',
        'type',
        'account_number',
        'notes',
        'images',
        'status',
    ];

    // Cast images JSON to array automatically
    protected $casts = [
        'images' => 'array',
        'status' => 'integer',
    ];

    // Optional helper to get full URLs for images stored in public/payment-types
    public function getImageUrlsAttribute()
    {
        $images = $this->images ?? [];
        return collect($images)->map(function ($file) {
            // asset() will produce full URL based on app url
            return asset("payment-types/{$file}");
        })->all();
    }
}
