<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerGroup extends Model
{
    use HasFactory;
    protected $guarded = [];

     public function customers()
    {
        return $this->hasMany(Customer::class, 'customer_group_id');
    }
}
