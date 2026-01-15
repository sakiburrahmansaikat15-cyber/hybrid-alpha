<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxGroup extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'description',
        'is_active',
    ];
}
