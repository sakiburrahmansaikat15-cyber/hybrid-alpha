<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'max_days',
        'status',
    ];


    public function leaveApplications()
    {
        return $this->hasMany(LeaveApplication::class, 'leave_type_id');
    }

}
