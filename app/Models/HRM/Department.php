<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;
     protected $fillable = [
        'name',
        'description',
        'manager_id',
        'status',
    ];

      public function designations()
    {
        return $this->hasMany(Designation::class, 'department_id');
    }

    public function employees()
{
    return $this->hasMany(Employee::class, 'department_id');
}

}
