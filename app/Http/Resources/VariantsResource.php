<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VariantsResource extends JsonResource
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
            'variant_name' => $this->variant_name,
            'sku' => $this->sku,
            'price' => $this->price,
            'stock_quantity' => $this->stock_quantity,
            'status' => $this->status,
            'product_id' => $this->product_id,
            'product' => new ProductsResource($this->whenLoaded('product')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
