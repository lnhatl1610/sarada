<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$root = dirname(__DIR__, 2);
$api = $root.DIRECTORY_SEPARATOR.'api';
$snapshotPath = $root.DIRECTORY_SEPARATOR.'fashion_store_schema.sql';

if (! is_file($snapshotPath)) {
    fwrite(STDERR, "Schema snapshot not found: {$snapshotPath}".PHP_EOL);
    exit(2);
}

require $api.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';
$app = require $api.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$snapshot = file_get_contents($snapshotPath);
if ($snapshot === false) {
    fwrite(STDERR, 'Could not read schema snapshot.'.PHP_EOL);
    exit(2);
}

preg_match_all(
    '/CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=[^;]+;/s',
    $snapshot,
    $tableMatches,
    PREG_SET_ORDER | PREG_OFFSET_CAPTURE,
);

$snapshotColumns = [];
$snapshotDefinitions = [];
foreach ($tableMatches as $tableMatch) {
    $table = $tableMatch[1][0];
    $snapshotDefinitions[$table] = $tableMatch[0][0];
    foreach (preg_split('/\r?\n/', $tableMatch[2][0]) ?: [] as $line) {
        if (! preg_match('/^\s*`([^`]+)`\s+(.+?)\s*,?\s*$/', $line, $columnMatch)) {
            continue;
        }

        $definition = rtrim(trim($columnMatch[2]), ',');
        if (! preg_match('/^([a-z]+(?:\([^)]*\))?(?:\s+unsigned)?)/i', $definition, $typeMatch)) {
            continue;
        }

        $snapshotColumns[$table][$columnMatch[1]] = [
            'type' => strtolower(preg_replace('/\s+/', ' ', $typeMatch[1])),
            'nullable' => ! preg_match('/\bNOT NULL\b/i', $definition),
        ];
    }
}

$database = DB::connection()->getDatabaseName();
$databaseColumns = DB::select(
    'SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION',
    [$database],
);

$liveColumns = [];
foreach ($databaseColumns as $column) {
    $liveColumns[$column->TABLE_NAME][$column->COLUMN_NAME] = [
        'type' => strtolower(preg_replace('/\s+/', ' ', $column->COLUMN_TYPE)),
        'nullable' => $column->IS_NULLABLE === 'YES',
    ];
}

$snapshotTables = array_keys($snapshotColumns);
$liveTables = array_keys($liveColumns);
sort($snapshotTables);
sort($liveTables);

$differences = [];
foreach (array_diff($liveTables, $snapshotTables) as $table) {
    $differences[] = "Table exists only in database: {$table}";
}
foreach (array_diff($snapshotTables, $liveTables) as $table) {
    $differences[] = "Table exists only in snapshot: {$table}";
}

foreach (array_intersect($liveTables, $snapshotTables) as $table) {
    $liveNames = array_keys($liveColumns[$table]);
    $snapshotNames = array_keys($snapshotColumns[$table]);
    foreach (array_diff($liveNames, $snapshotNames) as $column) {
        $differences[] = "Column exists only in database: {$table}.{$column}";
    }
    foreach (array_diff($snapshotNames, $liveNames) as $column) {
        $differences[] = "Column exists only in snapshot: {$table}.{$column}";
    }

    foreach (array_intersect($liveNames, $snapshotNames) as $column) {
        $live = $liveColumns[$table][$column];
        $saved = $snapshotColumns[$table][$column];
        if ($live !== $saved) {
            $differences[] = sprintf(
                '%s.%s differs (database: %s, %s; snapshot: %s, %s)',
                $table,
                $column,
                $live['type'],
                $live['nullable'] ? 'nullable' : 'not null',
                $saved['type'],
                $saved['nullable'] ? 'nullable' : 'not null',
            );
        }
    }
}

$columnCount = array_sum(array_map('count', $liveColumns));
$definitionDifferences = [];
$definitionContexts = [];
$showDefinitionDifferences = in_array('--details', $argv, true);
foreach (array_intersect($liveTables, $snapshotTables) as $table) {
    $quotedTable = str_replace('`', '``', $table);
    $createResult = DB::select("SHOW CREATE TABLE `{$quotedTable}`");
    $liveDefinition = $createResult[0]->{'Create Table'} ?? null;
    if (! is_string($liveDefinition)) {
        $definitionDifferences[] = "Could not read CREATE TABLE definition for {$table}";

        continue;
    }

    $normalizeDefinition = static function (string $definition): string {
        $definition = preg_replace('/\sAUTO_INCREMENT=\d+/i', '', $definition) ?? $definition;

        return trim(preg_replace('/\s+/', ' ', $definition) ?? $definition, " ;\t\n\r\0\x0B");
    };

    $normalizedLive = $normalizeDefinition($liveDefinition);
    $normalizedSnapshot = $normalizeDefinition($snapshotDefinitions[$table]);
    if ($normalizedLive !== $normalizedSnapshot) {
        $definitionDifferences[] = "CREATE TABLE definition differs for {$table}";
        $differenceOffset = 0;
        $limit = min(strlen($normalizedLive), strlen($normalizedSnapshot));
        while ($differenceOffset < $limit && $normalizedLive[$differenceOffset] === $normalizedSnapshot[$differenceOffset]) {
            $differenceOffset++;
        }
        $definitionContexts[$table] = [
            'database' => substr($normalizedLive, max(0, $differenceOffset - 80), 200),
            'snapshot' => substr($normalizedSnapshot, max(0, $differenceOffset - 80), 200),
        ];
    }
}

if ($showDefinitionDifferences) {
    foreach ($definitionContexts as $table => $context) {
        echo "\n{$table} database: {$context['database']}\n";
        echo "{$table} snapshot: {$context['snapshot']}\n";
    }
}

printf(
    "Compared %d tables and %d columns (table names, column names/types, nullability, and normalized CREATE TABLE definitions).\n",
    count($liveTables),
    $columnCount,
);

if ($differences !== [] || $definitionDifferences !== []) {
    fwrite(STDERR, implode(PHP_EOL, [...$differences, ...$definitionDifferences]).PHP_EOL);
    exit(1);
}

echo "Database structure matches fashion_store_schema.sql for the compared fields.\n";
echo "Normalized table definitions also match, including defaults, indexes, foreign keys, and table options. AUTO_INCREMENT counters are ignored.\n";
