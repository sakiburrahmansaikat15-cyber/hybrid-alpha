<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadSource extends Model
{
    use HasFactory;

    protected $guarded = [];

     public function leads()
    {
        return $this->hasMany(Lead::class, 'lead_source_id');
    }
}
