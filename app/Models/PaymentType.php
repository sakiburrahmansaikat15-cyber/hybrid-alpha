<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'amount_number',
        'notes',
        'image',
        'status',
    ];

    protected $casts = [
        'amount_number' => 'decimal:2',
        'status' => 'boolean',
    ];
}
