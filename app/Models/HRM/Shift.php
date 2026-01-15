<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'grace_time',
    ];

}
