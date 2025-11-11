<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'value',
        'description',
        'meta',
        'status',
    ];

    protected $casts = [
        'meta' => 'array',
        'status' => 'boolean',
    ];

    // Relationship
    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault([
            'name' => 'No Product',
        ]);
    }
}
