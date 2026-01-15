<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Product;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    // SaleItem belongs to a Product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
