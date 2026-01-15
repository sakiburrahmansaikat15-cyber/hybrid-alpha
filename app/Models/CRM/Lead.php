<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\LogsActivity;

class Lead extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'score',
        'lead_source_id',
        'lead_status_id',
    ];


    public function leadSource()
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    /**
     * Lead belongs to a Lead Status
     */
    public function leadStatus()
    {
        return $this->belongsTo(LeadStatus::class, 'lead_status_id');
    }

}
