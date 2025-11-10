<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $name
 * @property string|null $type
 * @property string|null $account_number
 * @property string|null $notes
 * @property array|null $images
 * @property bool $status
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 *
 * @property-read array $image_urls
 */
class PaymentType extends Model
{
    use HasFactory;

    /** Mass assignable */
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    protected $fillable = [
        'name',
        'type',
        'account_number',
        'notes',
        'images',
        'status',
    ];

    /** Casts */
// app/Models/PaymentType.php

protected $casts = [
    'images' => 'array',
    'status' => 'boolean',
];

public function getImageUrlsAttribute(): array
{
    return $this->images
        ? array_map(fn($path) => asset('storage/' . $path), $this->images)
        : [];
}

    /* =============================================================
       SCOPES
       ============================================================= */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', false);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('type', 'like', "%{$term}%")
              ->orWhere('account_number', 'like', "%{$term}%")
              ->orWhere('notes', 'like', "%{$term}%");
        });
    }
}
