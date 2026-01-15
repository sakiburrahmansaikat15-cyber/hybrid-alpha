<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'sub_type',
        'description',
        'is_active',
        'opening_balance'
    ];

    public function journalItems()
    {
        return $this->hasMany(JournalItem::class);
    }
}
