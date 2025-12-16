<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;
       protected $guarded = [];

        public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
