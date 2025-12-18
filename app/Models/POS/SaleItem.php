<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Prooducts;

class SaleItem extends Model
{
    use HasFactory;

     protected $guarded = [];

       public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    // SaleItem belongs to a Product
    public function product()
    {
        return $this->belongsTo(Prooducts::class, 'product_id');
    }
}
