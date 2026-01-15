<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categories extends Model
{
    use HasFactory, \App\Traits\LogsActivity, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'status',
        'image',
    ];

    protected $table = "categories";

    public function subCategories()
    {
        return $this->hasMany(SubCategory::class, 'category_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'cat_id');
    }

}
