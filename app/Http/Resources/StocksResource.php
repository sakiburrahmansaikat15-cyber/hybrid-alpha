<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StocksResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'vendor_id' => $this->vendor_id,
            'quantity' => $this->quantity,
            'buying_price' => $this->buying_price,
            'selling_price' => $this->selling_price,
            'total_amount' => $this->total_amount,
            'due_amount' => $this->due_amount,
            'stock_date' => $this->stock_date,
            'comission' => $this->comission,
            'status' => $this->status,
            'sku' => $this->sku,
            'product' => new ProductsResource($this->whenLoaded('product')),
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
