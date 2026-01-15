<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory;
     protected $fillable = [
        'customer_id',
        'address_type',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'zip_code',
        'country',
        'is_default',
    ];


       public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
