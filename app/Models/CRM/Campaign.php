<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'type',
        'start_date',
        'end_date',
        'budget',
        'expected_revenue',
        'actual_cost',
        'description',
        'status',
    ];
}
