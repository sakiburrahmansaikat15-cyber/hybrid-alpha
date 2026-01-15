<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\LogsActivity;

class Sale extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'sale_number',
        'terminal_id',
        'customer_id',
        'sale_date',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'change_amount',
        'payment_status',
        'notes',
        'status',
    ];

    public function terminal()
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }

    // Sale belongs to a customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }


    public function payments()
    {
        return $this->hasMany(SalePayment::class, 'sale_id');
    }


    public function taxes()
    {
        return $this->hasMany(SaleTax::class, 'sale_id');
    }


    public function discounts()
    {
        return $this->hasMany(SaleDiscount::class, 'sale_id');
    }


    public function items()
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }


    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'sale_id');
    }


}
