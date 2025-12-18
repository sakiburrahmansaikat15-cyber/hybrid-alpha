<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model
{
    use HasFactory;

      protected $guarded = [];


          public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    // Payment belongs to a Payment Method
    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
