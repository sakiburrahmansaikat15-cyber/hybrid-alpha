<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerialList extends Model
{
    use HasFactory;

    protected $guarded = [];

     public function stock()
    {
        return $this->belongsTo(Stocks::class, 'stock_id');
    }
}
