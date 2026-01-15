<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;
     protected $fillable = [
        'transaction_type',
        'amount',
        'payment_type_id',
        'reference_number',
        'description',
        'transaction_date',
        'status',
    ];



    public function stock()
    {
        return $this->belongsTo(Stocks::class, 'stock_id');
    }


    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class, 'payment_type_id');
    }
    
}
