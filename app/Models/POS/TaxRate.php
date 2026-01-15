<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use HasFactory;
     protected $fillable = [
        'name',
        'rate',
        'tax_group_id',
        'is_compound',
        'is_active',
    ];


     public function saleTaxes()
{
    return $this->hasMany(SaleTax::class, 'tax_rate_id');
}

}
