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
        Schema::table('events', function (Blueprint $table) {
            $table->json('customization')->nullable()->after('template');
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->string('table_number')->nullable()->after('email');
            $table->string('token')->unique()->after('table_number');
            $table->string('qr_code')->nullable()->after('token');
            $table->boolean('checked_in')->default(false)->after('qr_code');
            $table->timestamp('token_expires_at')->nullable()->after('checked_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('customization');
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn(['table_number', 'token', 'qr_code', 'checked_in', 'token_expires_at']);
        });
    }
};
