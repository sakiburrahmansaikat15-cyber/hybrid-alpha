<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiptTemplate extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'header',
        'footer',
        'logo',
        'is_default',
    ];
}
