<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'chart_of_account_id',
        'description',
        'quantity',
        'unit_price',
        'tax_amount',
        'line_total'
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAccount::class, 'chart_of_account_id');
    }
}
