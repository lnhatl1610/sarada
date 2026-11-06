<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$root = dirname(__DIR__, 2);
$api = $root.DIRECTORY_SEPARATOR.'api';
$snapshotPath = $root.DIRECTORY_SEPARATOR.'fashion_store_schema.sql';

require $api.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';
$app = require $api.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$connection = DB::connection();
if ($connection->getDriverName() !== 'mysql') {
    fwrite(STDERR, 'The schema snapshot exporter requires MySQL.'.PHP_EOL);
    exit(2);
}

$tables = DB::select(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = ? ORDER BY TABLE_NAME',
    [$connection->getDatabaseName(), 'BASE TABLE'],
);

$lines = [
    '/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;',
    "/*!40103 SET TIME_ZONE='+00:00' */;",
    '/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;',
    '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;',
    "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;",
    '/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;',
    '',
];

foreach ($tables as $table) {
    $name = (string) $table->TABLE_NAME;
    $quotedName = str_replace('`', '``', $name);
    $definition = DB::select("SHOW CREATE TABLE `{$quotedName}`")[0]->{'Create Table'} ?? null;
    if (! is_string($definition)) {
        fwrite(STDERR, "Could not read CREATE TABLE for {$name}.".PHP_EOL);
        exit(2);
    }

    $definition = preg_replace('/\sAUTO_INCREMENT=\d+/i', '', $definition) ?? $definition;
    $lines[] = "DROP TABLE IF EXISTS `{$quotedName}`;";
    $lines[] = '/*!40101 SET @saved_cs_client = @@character_set_client */;';
    $lines[] = '/*!50503 SET character_set_client = utf8mb4 */;';
    $lines[] = rtrim($definition, ';').';';
    $lines[] = '/*!40101 SET character_set_client = @saved_cs_client */;';
    $lines[] = '';
}

$lines = [...$lines,
    '/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;',
    '/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;',
    '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;',
    '/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;',
    '/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;',
];

if (file_put_contents($snapshotPath, implode(PHP_EOL, $lines).PHP_EOL) === false) {
    fwrite(STDERR, "Could not write schema snapshot: {$snapshotPath}".PHP_EOL);
    exit(2);
}

printf('Exported %d schema-only table definitions to %s.%s', count($tables), $snapshotPath, PHP_EOL);
