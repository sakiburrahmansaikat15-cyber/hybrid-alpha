<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

     protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'usage_limit',
        'used_count',
        'is_active',
    ];
}
