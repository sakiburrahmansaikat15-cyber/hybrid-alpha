<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'customer_id' => $this->customer_id,
            'opportunity_stage_id' => $this->opportunity_stage_id,
            'stage_id' => $this->opportunity_stage_id, // Alias
            'amount' => (float) $this->amount,
            'value' => (float) $this->amount, // Alias
            'probability' => (int) $this->probability,
            'expected_close_date' => $this->expected_close_date,
            'customer' => $this->whenLoaded('customer'),
            'stage' => $this->whenLoaded('stage'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
