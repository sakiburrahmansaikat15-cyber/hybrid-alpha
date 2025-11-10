<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class vendor extends Model
{
    protected $fillable=['name','shop_name','email','contact','address','image','status'];
    use HasFactory;
}
