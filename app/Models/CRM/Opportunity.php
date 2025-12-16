<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Opportunity extends Model
{
    use HasFactory;

          protected $guarded = [];

          public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Opportunity belongs to an Opportunity Stage
     */
    public function stage()
    {
        return $this->belongsTo(OpportunityStage::class, 'stage_id');
    }

}
