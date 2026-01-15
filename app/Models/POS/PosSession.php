<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosSession extends Model
{
    use HasFactory;
      protected $fillable = [
        'terminal_id',
        'user_id',
        'opening_balance',
        'closing_balance',
        'opened_at',
        'closed_at',
        'status',
        'notes',
    ];


        public function terminal()
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }
}
