<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;
     protected $guarded = [];


      public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
