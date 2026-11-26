<?php
declare(strict_types=1);
namespace OMT;
function config(): array {
    static $config;
    if ($config !== null) return $config;
    $file = getenv('OMTIFFIN_CONFIG') ?: dirname(__DIR__) . '/private/config.local.json';
    $config = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    if (($config['database']['name'] ?? '') !== 'maapn1f6_omtiffin' || ($config['database']['user'] ?? '') !== 'maapn1f6_omtiffin') {
        throw new \RuntimeException('Refusing a database outside the isolated OM Tiffin configuration');
    }
    if (empty($config['database']['password']) || str_contains($config['database']['password'],'ENTER_NEW')) {
        throw new \RuntimeException('OM Tiffin database password is not configured');
    }
    return $config;
}
function db(): \PDO {
    static $pdo;
    if ($pdo) return $pdo;
    $c = config()['database'];
    $pdo = new \PDO('mysql:host='.$c['host'].';dbname='.$c['name'].';charset=utf8mb4',$c['user'],$c['password'],[
        \PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_EMULATE_PREPARES=>false,\PDO::ATTR_STRINGIFY_FETCHES=>false
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== 'maapn1f6_omtiffin') throw new \RuntimeException('Database identity mismatch');
    return $pdo;
}

/**
 * Visitor analytics is deliberately isolated from the business database.
 * A separate database name and least-privilege user are mandatory. Failure to
 * connect is handled by the analytics module and must never interrupt orders,
 * billing, wallets, authentication, or customer portal requests.
 */
function analyticsDb(array $settings): ?\PDO {
    if (empty($settings['analytics']['enabled'])) return null;
    $business=$settings['database']??[];$c=$settings['analytics']['database']??[];
    foreach(['host','name','user','password'] as $key)if(empty($c[$key]))throw new \RuntimeException('Analytics database is not configured');
    if(($c['name']??'')===($business['name']??'')||($c['user']??'')===($business['user']??''))throw new \RuntimeException('Analytics storage must use an isolated database and user');
    $pdo=new \PDO('mysql:host='.$c['host'].';dbname='.$c['name'].';charset=utf8mb4',$c['user'],$c['password'],[
        \PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_EMULATE_PREPARES=>false,\PDO::ATTR_STRINGIFY_FETCHES=>false
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    if($pdo->query('SELECT DATABASE()')->fetchColumn()!==$c['name'])throw new \RuntimeException('Analytics database identity mismatch');
    return $pdo;
}
