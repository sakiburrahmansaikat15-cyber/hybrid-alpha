<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HoldCart extends Model
{
    use HasFactory;

      protected $guarded = [];


      public function terminal()
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }
}
