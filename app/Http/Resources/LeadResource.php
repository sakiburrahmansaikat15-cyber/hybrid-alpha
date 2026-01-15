<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'score' => (int) $this->score,
            'lead_source_id' => $this->lead_source_id,
            'lead_status_id' => $this->lead_status_id,
            'lead_source' => $this->whenLoaded('leadSource'),
            'lead_status' => $this->whenLoaded('leadStatus'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
