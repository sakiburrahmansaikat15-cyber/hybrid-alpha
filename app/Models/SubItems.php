<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubItems extends Model
{
    use HasFactory;
    protected $table = 'sub_items';

    protected $fillable = [
        'name',
        'sub_category_id',
        'description',
        'status',
        'image',
    ];

    public function subcategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }


    public function products()
    {
        return $this->hasMany(Product::class, 'sub_item_id');
    }
}
