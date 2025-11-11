<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name', 'description', 'specifications', 'image', 'status',
        'category_id', 'brand_id', 'sub_category_id', 'sub_item_id',
        'unit_id', 'product_type_id'
    ];

    public function category() { return $this->belongsTo(Category::class); }
    public function brand() { return $this->belongsTo(Brand::class); }
    public function subCategory() { return $this->belongsTo(SubCategory::class); }
    public function subItem() { return $this->belongsTo(SubItem::class); }
    public function unit() { return $this->belongsTo(Unit::class); }
    public function productType() { return $this->belongsTo(ProductType::class); }
}
