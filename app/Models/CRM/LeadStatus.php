<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadStatus extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'color_code',
        'order',
    ];

    public function leads()
    {
        return $this->hasMany(Lead::class, 'lead_status_id');
    }
}
