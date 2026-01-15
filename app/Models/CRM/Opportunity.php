<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\LogsActivity;

class Opportunity extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name',
        'customer_id',
        'opportunity_stage_id',
        'amount',
        'probability',
        'expected_close_date',
        'assigned_to',
        'description',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Opportunity belongs to an Opportunity Stage
     */
    public function stage()
    {
        return $this->belongsTo(OpportunityStage::class, 'opportunity_stage_id');
    }

}
