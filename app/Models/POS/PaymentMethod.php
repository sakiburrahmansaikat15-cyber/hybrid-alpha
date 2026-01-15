<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];


     public function salePayments()
{
    return $this->hasMany(SalePayment::class, 'payment_method_id');
}

}
