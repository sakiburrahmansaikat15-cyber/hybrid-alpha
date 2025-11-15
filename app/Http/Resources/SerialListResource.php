<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SerialListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
         return [
            'id'        => $this->id,
            'stock_id'  => $this->stock_id,
            'sku'       => $this->sku,
            'barcode'   => $this->barcode,
            'color'     => $this->color,
            'notes'     => $this->notes,
            'image'     => $this->image,
            'status'    => $this->status,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
