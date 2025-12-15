<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Designation extends Model
{
    use HasFactory;
    protected $guarded = [];

     public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function employees()
{
    return $this->hasMany(Employee::class, 'designation_id');
}


}
