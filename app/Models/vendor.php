<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $guarded = [];

    // This is the key fix: cast status as boolean
    protected $casts = [
        'status' => 'boolean',  // true = active, false = inactive
    ];

    public function stocks()
    {
        return $this->hasMany(Stocks::class, 'vendor_id');
    }

    // Optional: Human-readable accessor for frontend
    public function getStatusTextAttribute()
    {
        return $this->status ? 'active' : 'inactive';
    }
}
