<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;
    protected $guarded = [];


       public function stocks()
    {
        return $this->hasMany(Stocks::class, 'warehouse_id');
    }

}
