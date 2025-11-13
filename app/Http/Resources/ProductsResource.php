<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductsResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'specification' => $this->specification,
            'image' => $this->image,
            'status' => $this->status,

            // Foreign key IDs
            'cat_id' => $this->cat_id,
            'brand_id' => $this->brand_id,
            'sub_cat_id' => $this->sub_cat_id,
            'sub_item_id' => $this->sub_item_id,
            'unit_id' => $this->unit_id,
            'product_type_id' => $this->product_type_id,

            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
