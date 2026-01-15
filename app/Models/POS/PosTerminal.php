<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosTerminal extends Model
{
    use HasFactory;
     protected $fillable = [
        'name',
        'code',
        'location',
        'is_active',
        'receipt_template_id',
    ];

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
