<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;
     protected $fillable = [
        'sale_id',
        'receipt_number',
        'template_id',
        'printed_at',
    ];


      public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
