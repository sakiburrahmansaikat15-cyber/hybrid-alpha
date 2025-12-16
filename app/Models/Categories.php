<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categories extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $table = "categories";

    public function subCategories()
    {
        return $this->hasMany(SubCategory::class, 'category_id');
    }

        public function products()
    {
        return $this->hasMany(Prooducts::class, 'cat_id');
    }

}
