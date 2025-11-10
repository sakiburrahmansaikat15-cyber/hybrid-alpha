<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image',
        'description',
        'status',
        'category_id',
        'brand_id',
        'sub_item_id',
        'sub_category_id',
        'unit_id',
        'specifications',
        'product_type_id',
    ];

    // Make all relationships handle null values
    public function category()   { return $this->belongsTo(Category::class)->withDefault(['name' => 'No Category']); }
    public function brand()      { return $this->belongsTo(Brand::class)->withDefault(['name' => 'No Brand']); }
    public function subCategory(){ return $this->belongsTo(SubCategory::class)->withDefault(['name' => 'No Sub-category']); }
    public function subItem()    { return $this->belongsTo(SubItem::class)->withDefault(['name' => 'No Sub-item']); }
    public function unit()       { return $this->belongsTo(Unit::class)->withDefault(['name' => 'No Unit']); }
    public function productType(){ return $this->belongsTo(ProductType::class)->withDefault(['name' => 'No Product Type']); }
}