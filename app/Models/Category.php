<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'images',
        'status',
    ];

    protected $casts = [
        'images' => 'array',
        'status' => 'string',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function getFirstImageAttribute()
    {
        $images = $this->images ?? [];
        return !empty($images) ? asset('storage/categories/' . basename($images[0])) : null;
    }

    public function getAllImagesAttribute()
    {
        $images = $this->images ?? [];
        return array_map(function($image) {
            return asset('storage/categories/' . basename($image));
        }, $images);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($category) {
            if ($category->images) {
                foreach ($category->images as $image) {
                    $imagePath = 'public/categories/' . basename($image);
                    if (Storage::exists($imagePath)) {
                        Storage::delete($imagePath);
                    }
                }
            }
        });
    }
}