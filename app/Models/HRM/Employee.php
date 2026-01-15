<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\LogsActivity;

class Employee extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'employee_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'department_id',
        'designation_id',
        'join_date',
        'job_type',
        'salary_type',
        'status',
    ];



    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }


    public function designation()
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class, 'employee_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }


    public function leaveApplications()
    {
        return $this->hasMany(LeaveApplication::class, 'employee_id');
    }


    public function salaries()
    {
        return $this->hasMany(Salary::class, 'employee_id');
    }


    public function payrolls()
    {
        return $this->hasMany(Payroll::class, 'employee_id');
    }


}
