<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleDiscount extends Model
{
    use HasFactory;

      protected $fillable = [
        'sale_id',
        'discount_type',
        'discount_value',
        'discount_amount',
        'reason',
    ];


         public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
