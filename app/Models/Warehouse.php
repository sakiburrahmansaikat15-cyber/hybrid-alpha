<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'contact_person',
        'phone',
        'email',
        'address',
        'country',
        'state',
        'city',
        'capacity',
        'is_default',
        'status',
    ];


    public function stocks()
    {
        return $this->hasMany(Stocks::class, 'warehouse_id');
    }

}
