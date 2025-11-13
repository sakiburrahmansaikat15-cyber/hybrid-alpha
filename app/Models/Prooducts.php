<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prooducts extends Model
{
    use HasFactory;

    protected $guarded = [];

    // Belongs to category
    public function category()
    {
        return $this->belongsTo(Categories::class, 'cat_id');
    }

    // Belongs to brand
    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    // Belongs to sub-category
    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_cat_id');
    }

    // Belongs to sub-item
    public function subItem()
    {
        return $this->belongsTo(SubItems::class, 'sub_item_id');
    }

    // Belongs to unit
    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    // Belongs to product type
    public function productType()
    {
        return $this->belongsTo(ProductType::class, 'product_type_id');
    }


       public function variants()
    {
        return $this->hasMany(variants::class, 'product_id');
    }


    public function stocks()
{
    return $this->hasMany(Stocks::class, 'product_id');
}
}
