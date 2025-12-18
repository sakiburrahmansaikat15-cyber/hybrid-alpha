<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory;
     protected $guarded = [];


       public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
