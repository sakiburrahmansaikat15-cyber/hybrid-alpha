<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerialList extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_id',
        'sku',
        'barcode',
        'color',
        'notes',
        'image',
        'status',
    ];

    public function stock()
    {
        return $this->belongsTo(Stocks::class, 'stock_id');
    }
}
