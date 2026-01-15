<?php

namespace App\Models\CRM;

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
        'company_id',
        'type',
        'address',
        'website',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }


    public function contacts()
    {
        return $this->hasMany(Contact::class, 'customer_id');
    }

    public function opportunities()
    {
        return $this->hasMany(Opportunity::class, 'customer_id');
    }


    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'customer_id');
    }

}
