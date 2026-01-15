<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsActivity;

class Customer extends Model
{
  use HasFactory, SoftDeletes, LogsActivity;

  protected $fillable = [
    'name',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'zip_code',
    'country',
    'customer_group_id',
    'tax_number',
    'notes',
    'status',
  ];

  protected $table = 'pos_customers';

  public function customergroup()
  {
    return $this->belongsTo(CustomerGroup::class, 'customer_group_id');
  }

  public function addresses()
  {
    return $this->hasMany(CustomerAddress::class, 'customer_id');
  }


  public function sale()
  {
    return $this->hasMany(Sale::class, 'customer_id');
  }
}
