<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GiftCard extends Model
{
    use HasFactory;
    
     protected $fillable = [
        'code',
        'balance',
        'initial_balance',
        'customer_id',
        'expiry_date',
        'status',
    ];
}
