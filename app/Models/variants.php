<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variants extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'product_id',
        'variant_name',
        'sku',
        'price',
        'stock_quantity',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

}
