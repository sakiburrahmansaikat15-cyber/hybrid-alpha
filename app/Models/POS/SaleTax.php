<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleTax extends Model
{
    use HasFactory;

     protected $fillable = [
        'sale_id',
        'tax_rate_id',
        'tax_amount',
        'taxable_amount',
    ];


        public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    // SaleTax belongs to a TaxRate
    public function taxRate()
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id');
    }
}
