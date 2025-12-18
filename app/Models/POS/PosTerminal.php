<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosTerminal extends Model
{
    use HasFactory;
     protected $guarded = [];

       public function sessions()
    {
        return $this->hasMany(PosSession::class, 'terminal_id');
    }


    public function holdCarts()
{
    return $this->hasMany(HoldCart::class, 'terminal_id');
}


     public function sale()
    {
        return $this->hasMany(Sale::class, 'terminal_id');
    }

}
