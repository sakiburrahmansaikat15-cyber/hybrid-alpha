<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

      protected $guarded = [];

        protected $table = 'pos_customers';

         public function customergroup()
    {
        return $this->belongsTo(CustomerGroup::class, 'customer_group_id');
    }

      public function addresses()
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id');
    }


     public function sale()
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }
}
