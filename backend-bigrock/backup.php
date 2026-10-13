<?php
declare(strict_types=1);
namespace OMT;
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/config.php';
umask(0077);
function backupRow(array $row):string {return json_encode(array_map(fn($value)=>$value===null?null:base64_encode((string)$value),$row),JSON_THROW_ON_ERROR)."\n";}
function quoted(string $name):string {if(!preg_match('/^[a-zA-Z0-9_]+$/D',$name))throw new \RuntimeException('Unexpected database identifier');return '`'.$name.'`';}
function ordered(\PDO $pdo,string $table):string {$keys=$pdo->query('SHOW KEYS FROM '.quoted($table)." WHERE Key_name='PRIMARY'")->fetchAll(\PDO::FETCH_ASSOC);usort($keys,fn($a,$b)=>$a['Seq_in_index']<=>$b['Seq_in_index']);return $keys?' ORDER BY '.implode(',',array_map(fn($key)=>quoted($key['Column_name']),$keys)):'';}
function createBackup(\PDO $pdo):array {
    $base='/home1/maapn1f6/omtiffin-private';$directory=$base.'/backups/'.gmdate('Y-m-d\TH-i-s\Z').'-'.bin2hex(random_bytes(4));if(!mkdir($directory,0700,true))throw new \RuntimeException('Backup directory unavailable');
    $manifest=['database'=>'maapn1f6_omtiffin','capturedAt'=>gmdate('c'),'consistentSnapshot'=>true,'tables'=>[],'uploads'=>[]];
    $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');$pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    try{foreach($pdo->query('SHOW FULL TABLES')->fetchAll(\PDO::FETCH_NUM)as [$table,$type]){if($type!=='BASE TABLE')throw new \RuntimeException('Backup requires an explicit strategy for database views');quoted($table);$schema=$pdo->query('SHOW CREATE TABLE '.quoted($table))->fetch(\PDO::FETCH_NUM)[1];
        $file=$table.'.jsonl.gz';$stream=gzopen($directory.'/'.$file,'wb6');if(!$stream)throw new \RuntimeException('Backup file unavailable');$digest=hash_init('sha256');$count=0;$columns=[];$order=ordered($pdo,$table);
        try{$query=$pdo->query('SELECT * FROM '.quoted($table).$order);while($row=$query->fetch(\PDO::FETCH_ASSOC)){$columns=array_keys($row);$line=backupRow($row);if(gzwrite($stream,$line)!==strlen($line))throw new \RuntimeException('Backup write incomplete');hash_update($digest,$line);$count++;}}
        finally{gzclose($stream);}
        if(!$columns)$columns=array_column($pdo->query('SHOW COLUMNS FROM '.quoted($table))->fetchAll(\PDO::FETCH_ASSOC),'Field');
        $manifest['tables'][]=['name'=>$table,'file'=>$file,'schema'=>$schema,'columns'=>$columns,'order'=>$order,'rows'=>$count,'rowSha256'=>hash_final($digest),'fileSha256'=>hash_file('sha256',$directory.'/'.$file)];
    }$pdo->commit();}catch(\Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    $active=getenv('OMTIFFIN_CONFIG')?:$base.'/private/config.local.json';$real=realpath($active);if(!$real||dirname($real)!==$base.'/private')throw new \RuntimeException('Unexpected private configuration path');copy($real,$directory.'/config.private.json');chmod($directory.'/config.private.json',0600);$manifest['configurationSha256']=hash_file('sha256',$directory.'/config.private.json');
    $uploads=$base.'/private/uploads';if(is_dir($uploads)){mkdir($directory.'/uploads',0700);foreach(new \DirectoryIterator($uploads)as $file){if($file->isDot())continue;if(!$file->isFile()||$file->isLink())throw new \RuntimeException('Unexpected upload layout requires review');$name=$file->getFilename();copy($file->getPathname(),$directory.'/uploads/'.$name);chmod($directory.'/uploads/'.$name,0600);$manifest['uploads'][]=['file'=>$name,'sha256'=>hash_file('sha256',$directory.'/uploads/'.$name),'bytes'=>$file->getSize()];}}
    file_put_contents($directory.'/manifest.json',json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));return [$directory,$manifest];
}
function probeRestore(\PDO $pdo,string $directory,array $manifest):array {
    $restored=0;
    foreach($manifest['tables']as $table){$name=$table['name'];$probe='omt_restore_probe_'.$name;if(!hash_equals($table['fileSha256'],hash_file('sha256',$directory.'/'.$table['file'])))throw new \RuntimeException('Backup file hash mismatch');
        $pdo->exec('CREATE TEMPORARY TABLE '.quoted($probe).' LIKE '.quoted($name));
        try{$insert=$pdo->prepare('INSERT INTO '.quoted($probe).'('.implode(',',array_map(__NAMESPACE__.'\\quoted',$table['columns'])).') VALUES('.implode(',',array_fill(0,count($table['columns']),'?')).')');$stream=gzopen($directory.'/'.$table['file'],'rb');$digest=hash_init('sha256');$count=0;
            try{while(($line=gzgets($stream))!==false){hash_update($digest,$line);$row=json_decode($line,true,512,JSON_THROW_ON_ERROR);$values=[];foreach($table['columns']as $column){$value=$row[$column];$decoded=$value===null?null:base64_decode($value,true);if($value!==null&&$decoded===false)throw new \RuntimeException('Backup value corrupt');$values[]=$decoded;}$insert->execute($values);$count++;}}finally{gzclose($stream);}
            if($count!==$table['rows']||!hash_equals($table['rowSha256'],hash_final($digest)))throw new \RuntimeException('Backup record hash mismatch');
            $digest=hash_init('sha256');$query=$pdo->query('SELECT * FROM '.quoted($probe).$table['order']);$count=0;while($row=$query->fetch(\PDO::FETCH_ASSOC)){hash_update($digest,backupRow($row));$count++;}
            if($count!==$table['rows']||!hash_equals($table['rowSha256'],hash_final($digest)))throw new \RuntimeException('Restore probe changed values');$restored+=$count;
        }finally{$pdo->exec('DROP TEMPORARY TABLE '.quoted($probe));}
    }
    return ['tables'=>count($manifest['tables']),'rows'=>$restored,'allValuesMatched'=>true,'originalTablesModified'=>false];
}
try{[$directory,$manifest]=createBackup(db());$report=['success'=>true,'database'=>'maapn1f6_omtiffin','tables'=>count($manifest['tables']),'rows'=>array_sum(array_column($manifest['tables'],'rows')),'uploads'=>count($manifest['uploads']),'backupPath'=>$directory,'realProviderCalls'=>0];if(in_array('--probe',$argv,true))$report['restoreProbe']=probeRestore(db(),$directory,$manifest);file_put_contents($directory.'/verification.json',json_encode($report,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));echo json_encode($report,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR).PHP_EOL;}
catch(\Throwable){fwrite(STDERR,"OM Tiffin backup/restore verification failed; private details withheld.\n");exit(1);}
