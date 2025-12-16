<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;
     protected $guarded = [];

       public function customers()
    {
        return $this->hasMany(Customer::class, 'company_id');
    }
}
