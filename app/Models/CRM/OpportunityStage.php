<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpportunityStage extends Model
{
    use HasFactory;

      protected $fillable = [
        'name',
        'probability',
        'order',
        'is_closed',
        'is_won',
        'description',
    ];


        public function opportunities()
    {
        return $this->hasMany(Opportunity::class, 'stage_id');
    }
}
