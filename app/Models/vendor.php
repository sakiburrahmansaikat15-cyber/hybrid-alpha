<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory, \App\Traits\LogsActivity, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'name',
        'shop_name',
        'email',
        'contact',
        'address',
        'image',
        'status',
    ];


    public function stocks()
    {
        return $this->hasMany(Stocks::class, 'vendor_id');
    }

}
