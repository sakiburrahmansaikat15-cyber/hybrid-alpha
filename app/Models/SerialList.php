<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerialList extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'stocks_id',
        'warehouse_id',
        'sku',
        'barcode',
        'color',
        'notes',
        'image',
        'status',
    ];

    public function stock()
    {
        return $this->belongsTo(Stock::class, 'stocks_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
