<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

     protected $guarded = [];


     public function salePayments()
{
    return $this->hasMany(SalePayment::class, 'payment_method_id');
}

}
