<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Product;
use App\Models\Vendor;

class Stocks extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'vendor_id',
        'payment_type_id',
        'quantity',
        'buying_price',
        'selling_price',
        'total_amount',
        'due_amount',
        'tax',
        'stock_date',
        'expire_date',
        'paid_amount',
        'sku',
        'comission',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function serialLists()
    {
        return $this->hasMany(SerialList::class, 'stock_id');
    }


    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'stock_id');
    }


    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class, 'payment_type_id');
    }


}
