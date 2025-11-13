<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubItems extends Model
{
    use HasFactory;
     protected $table = 'sub_items';
    protected $guarded = [];

    public function subcategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }


        public function products()
    {
        return $this->hasMany(Prooducts::class, 'sub_item_id');
    }
}
