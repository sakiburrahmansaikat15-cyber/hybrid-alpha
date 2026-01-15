<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentGateway extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'gateway_type',
        'api_key',
        'api_secret',
        'is_active',
        'config',
    ];
}
