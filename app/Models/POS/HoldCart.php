<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HoldCart extends Model
{
    use HasFactory;

      protected $fillable = [
        'terminal_id',
        'customer_id',
        'cart_data',
        'notes',
        'status',
    ];


      public function terminal()
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }
}
