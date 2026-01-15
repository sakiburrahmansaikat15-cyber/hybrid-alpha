<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'fiscal_year',
        'start_date',
        'end_date',
        'total_budgeted_amount',
        'total_actual_amount',
        'status'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(BudgetItem::class);
    }
}
