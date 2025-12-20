<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Prooducts;
use App\Models\Vendor;

class Stocks extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Prooducts::class, 'product_id');
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


}
