<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Transaction extends Model {
use HasFactory;


protected $fillable = [
'type', 'amount', 'stock_id', 'payment_type_id', 'image', 'status'
];


public function stock() {
return $this->belongsTo(Stock::class);
}


public function paymentType() {
return $this->belongsTo(PaymentType::class);
}
}
