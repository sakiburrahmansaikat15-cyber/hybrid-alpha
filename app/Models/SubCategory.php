<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'description',
        'status',
        'image',
    ];

    public function category()
    {
        return $this->belongsTo(Categories::class, 'category_id');
    }


    public function subitems()
    {
        return $this->hasMany(SubItems::class, 'sub_category_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'sub_cat_id');
    }

}
