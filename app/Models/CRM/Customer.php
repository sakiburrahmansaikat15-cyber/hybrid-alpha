<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

      protected $guarded = [];

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
