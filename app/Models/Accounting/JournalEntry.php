<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'reference',
        'description',
        'status'
    ];

    public function items()
    {
        return $this->hasMany(JournalItem::class);
    }

    public function getTotalDebitAttribute()
    {
        return $this->items->sum('debit');
    }

    public function getTotalCreditAttribute()
    {
        return $this->items->sum('credit');
    }
}
