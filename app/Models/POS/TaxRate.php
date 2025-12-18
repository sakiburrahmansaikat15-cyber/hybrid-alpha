<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use HasFactory;
     protected $guarded = [];


     public function saleTaxes()
{
    return $this->hasMany(SaleTax::class, 'tax_rate_id');
}

}
