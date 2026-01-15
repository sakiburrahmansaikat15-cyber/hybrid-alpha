<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'bill_number',
        'vendor_id',
        'bill_date',
        'due_date',
        'subtotal',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'balance',
        'status',
        'notes',
        'reference_number'
    ];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
    ];

    public function vendor()
    {
        return $this->belongsTo(\App\Models\Vendor::class);
    }

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }
}
