<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'phone' => $this->phone,
            'email' => $this->email,
            'department_id' => $this->department_id,
            'designation_id' => $this->designation_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'designation' => new DesignationResource($this->whenLoaded('designation')),
            'join_date' => $this->join_date,
            'job_type' => $this->job_type,
            'salary_type' => $this->salary_type,
            'status' => $this->status,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
