<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, remove any existing duplicates, keeping the oldest one
        $duplicates = \Illuminate\Support\Facades\DB::table('tables')
            ->select('event_id', 'name', \Illuminate\Support\Facades\DB::raw('MIN(id) as min_id'))
            ->groupBy('event_id', 'name')
            ->get();
            
        foreach ($duplicates as $duplicate) {
            \Illuminate\Support\Facades\DB::table('tables')
                ->where('event_id', $duplicate->event_id)
                ->where('name', $duplicate->name)
                ->where('id', '!=', $duplicate->min_id)
                ->delete();
        }

        Schema::table('tables', function (Blueprint $table) {
            $table->unique(['event_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'name']);
        });
    }
};
