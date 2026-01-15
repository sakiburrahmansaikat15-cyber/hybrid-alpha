<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'account_number',
        'notes',
        'image',
        'status',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'payment_type_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stocks::class, 'payment_type_id');
    }
}
