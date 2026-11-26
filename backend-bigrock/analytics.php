<?php
declare(strict_types=1);
namespace OMT;

final class CsvResponse {public function __construct(public readonly string $text,public readonly string $filename){}}

final class VisitorAnalytics {
    private ?\PDO $pdo=null;private ?string $unavailable=null;
    public function __construct(private readonly array $settings,private readonly Store $businessStore){
        if(empty($settings['analytics']['enabled']))return;
        try{$this->pdo=analyticsDb($settings);$this->validateSecrets();}catch(\Throwable $e){$this->unavailable='Visitor analytics storage is unavailable.';error_log('OM_TIFFIN_ANALYTICS_UNAVAILABLE');}
    }
    public function track(array $body,array $context,?array $customer):array {
        if(empty($this->settings['analytics']['enabled'])||!$this->pdo)return [204,[]];
        try{
            $session=$this->text($body['sessionId']??'',64,'session');$visitor=$this->text($body['visitorId']??'',64,'visitor');
            if(!preg_match('/^[A-Za-z0-9_-]{16,64}$/D',$session)||!preg_match('/^[A-Za-z0-9_-]{16,64}$/D',$visitor))throw new HttpError(400,'Invalid analytics identity.');
            $page=$this->path($body['page']??'/');$entry=$this->path($body['entryPage']??$page);$headers=$context['headers']??[];
            $ip=self::clientIp((string)($context['remoteAddress']??''),(string)($headers['x-forwarded-for']??''),(array)($this->settings['analytics']['trustedProxyCidrs']??[]));
            $ipHash=$this->hashValue($ip,'ipHashKey');$visitorHash=$this->hashValue($visitor,'visitorHashKey');$ua=$this->text($headers['user-agent']??'',500,'user agent',true);
            $agent=self::parseUserAgent($ua);$now=gmdate('Y-m-d H:i:s.v');
            $this->pdo->beginTransaction();
            $rate=$this->pdo->prepare('SELECT COUNT(*) FROM visitor_pageviews p JOIN visitor_sessions s ON s.session_id=p.session_id WHERE s.ip_hash=? AND p.visited_at>=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE)');$rate->execute([$ipHash]);
            if((int)$rate->fetchColumn()>=max(10,(int)($this->settings['analytics']['rateLimitPerMinute']??60))){$this->pdo->rollBack();return [204,[]];}
            $existing=$this->pdo->prepare('SELECT last_page,last_activity FROM visitor_sessions WHERE session_id=? FOR UPDATE');$existing->execute([$session]);$current=$existing->fetch(\PDO::FETCH_ASSOC);
            $returning=$this->pdo->prepare('SELECT 1 FROM visitor_sessions WHERE visitor_hash=? AND session_id<>? LIMIT 1');$returning->execute([$visitorHash,$session]);$isReturning=(bool)$returning->fetchColumn();
            $customerId=$customer['customer']??null;
            $values=[$session,$visitorHash,$ipHash,$this->encryptIp($ip),$customerId,$now,$now,$entry,$page,$ua,$agent['device'],$agent['os'],$agent['browser'],$agent['version'],$this->resolution($body['screenResolution']??''),$this->resolution($body['viewportResolution']??''),in_array($body['orientation']??'', ['portrait','landscape'],true)?$body['orientation']:'Unknown',$isReturning?1:0];
            $sql='INSERT INTO visitor_sessions(session_id,visitor_hash,ip_hash,ip_cipher,customer_id,first_seen,last_activity,entry_page,last_page,user_agent,device_category,os_name,browser_name,browser_version,screen_resolution,viewport_resolution,orientation,is_returning) VALUES('.implode(',',array_fill(0,18,'?')).') ON DUPLICATE KEY UPDATE customer_id=COALESCE(VALUES(customer_id),customer_id),last_activity=VALUES(last_activity),last_page=VALUES(last_page),screen_resolution=VALUES(screen_resolution),viewport_resolution=VALUES(viewport_resolution),orientation=VALUES(orientation)';
            $this->pdo->prepare($sql)->execute($values);
            $duplicate=$current&&$current['last_page']===$page&&strtotime($current['last_activity'])>=time()-30;
            if(!$duplicate)$this->pdo->prepare('INSERT INTO visitor_pageviews(session_id,path,visited_at) VALUES(?,?,?)')->execute([$session,$page,$now]);
            $this->pdo->commit();
            if(random_int(1,100)===1)$this->purge();
        }catch(HttpError $e){if($this->pdo?->inTransaction())$this->pdo->rollBack();throw $e;}
        catch(\Throwable){if($this->pdo?->inTransaction())$this->pdo->rollBack();error_log('OM_TIFFIN_ANALYTICS_TRACK_FAILED');}
        return [204,[]];
    }
    public function dashboard(array $query,array $admin):array {
        $this->requireAvailable();$from=$this->date($query['from']??null,false);$to=$this->date($query['to']??null,true);$conditions=[];$args=[];if($from){$conditions[]='first_seen>=?';$args[]=$from;}if($to){$conditions[]='first_seen<=?';$args[]=$to;}$range=$conditions?' WHERE '.implode(' AND ',$conditions):'';$andRange=$conditions?' AND '.implode(' AND ',$conditions):'';$pageRange=str_replace('first_seen','visited_at',$range);
        $one=function(string $sql,array $params=[]) { $q=$this->pdo->prepare($sql);$q->execute($params);return $q->fetchColumn();};
        $today="DATE(CONVERT_TZ(first_seen,'+00:00','+05:30'))=DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+05:30'))";
        $metrics=[
            'todayVisits'=>(int)$one("SELECT COUNT(*) FROM visitor_sessions WHERE $today"),
            'todayUnique'=>(int)$one("SELECT COUNT(DISTINCT visitor_hash) FROM visitor_sessions WHERE $today"),
            'active'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE last_activity>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)'),
            'yesterday'=>(int)$one("SELECT COUNT(*) FROM visitor_sessions WHERE DATE(CONVERT_TZ(first_seen,'+00:00','+05:30'))=DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+05:30')),INTERVAL 1 DAY)"),
            'week'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE first_seen>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 7 DAY)'),
            'month'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE first_seen>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 30 DAY)'),
            'new'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE is_returning=0'.$andRange,$args),
            'returning'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE is_returning=1'.$andRange,$args),
            'guest'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE customer_id IS NULL'.$andRange,$args),
            'customers'=>(int)$one('SELECT COUNT(*) FROM visitor_sessions WHERE customer_id IS NOT NULL'.$andRange,$args),
            'mobile'=>(int)$one("SELECT COUNT(*) FROM visitor_sessions WHERE device_category='Mobile'".$andRange,$args),
            'tablet'=>(int)$one("SELECT COUNT(*) FROM visitor_sessions WHERE device_category='Tablet'".$andRange,$args),
            'desktop'=>(int)$one("SELECT COUNT(*) FROM visitor_sessions WHERE device_category='Desktop'".$andRange,$args),
            'averageDurationSeconds'=>(int)$one('SELECT COALESCE(AVG(TIMESTAMPDIFF(SECOND,first_seen,last_activity)),0) FROM visitor_sessions'.$range,$args)
        ];
        return [200,['success'=>true,'enabled'=>true,'fullIpAuthorized'=>$this->canFullIp($admin),'metrics'=>$metrics,'devices'=>$this->group('device_category',$range,$args),'browsers'=>$this->group('browser_name',$range,$args),'operatingSystems'=>$this->group('os_name',$range,$args),'daily'=>$this->traffic('DATE(CONVERT_TZ(visited_at,\'+00:00\',\'+05:30\'))','day',30,$pageRange,$args),'hourly'=>$this->traffic('HOUR(CONVERT_TZ(visited_at,\'+00:00\',\'+05:30\'))','hour',24,$pageRange,$args),'monthly'=>$this->traffic('DATE_FORMAT(CONVERT_TZ(visited_at,\'+00:00\',\'+05:30\'),\'%Y-%m\')','month',12,$pageRange,$args),'pages'=>$this->pages($pageRange,$args)]];
    }
    public function logs(array $query,array $admin,bool $export=false):array|CsvResponse {
        $this->requireAvailable();$page=max(1,(int)($query['page']??1));$limit=$export?10000:min(100,max(10,(int)($query['limit']??25)));$where=[];$args=[];
        foreach(['device'=>'device_category','browser'=>'browser_name','customer'=>'customer_id']as $key=>$column)if(($query[$key]??'')!==''){$where[]="$column=?";$args[]=$this->text($query[$key],100,$key);}
        if(($query['kind']??'')==='guest')$where[]='customer_id IS NULL';if(($query['kind']??'')==='customer')$where[]='customer_id IS NOT NULL';
        if(($query['active']??'')==='true')$where[]='last_activity>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)';if(($query['active']??'')==='false')$where[]='last_activity<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)';
        if(($query['path']??'')!==''){$where[]='last_page LIKE ?';$args[]='%'.$this->text($query['path'],200,'path').'%';}
        if(($query['from']??'')!==''){$where[]='first_seen>=?';$args[]=$this->date($query['from'],false);}if(($query['to']??'')!==''){$where[]='first_seen<=?';$args[]=$this->date($query['to'],true);}
        if(($query['ip']??'')!==''){if(!$this->canFullIp($admin))throw new HttpError(403,'Full IP search requires additional authorization.');$where[]='ip_hash=?';$args[]=$this->hashValue($query['ip'],'ipHashKey');}
        $clause=$where?' WHERE '.implode(' AND ',$where):'';$count=$this->pdo->prepare('SELECT COUNT(*) FROM visitor_sessions'.$clause);$count->execute($args);$total=(int)$count->fetchColumn();
        $sorts=['firstVisit'=>'first_seen','lastActivity'=>'last_activity','device'=>'device_category','browser'=>'browser_name','page'=>'last_page'];$sort=$sorts[$query['sort']??'lastActivity']??'last_activity';$direction=strtolower((string)($query['direction']??'desc'))==='asc'?'ASC':'DESC';
        $sql='SELECT * FROM visitor_sessions'.$clause.' ORDER BY '.$sort.' '.$direction.' LIMIT '.$limit.' OFFSET '.(($page-1)*$limit);$q=$this->pdo->prepare($sql);$q->execute($args);$rows=[];
        foreach($q->fetchAll(\PDO::FETCH_ASSOC)as $row){$full=$this->decryptIp($row['ip_cipher']);$customer=$row['customer_id']?$this->businessStore->get('tiffins',$row['customer_id']):null;$rows[]=['visitId'=>$row['session_id'],'firstVisit'=>$row['first_seen'].'Z','lastActivity'=>$row['last_activity'].'Z','durationSeconds'=>max(0,strtotime($row['last_activity'])-strtotime($row['first_seen'])),'entryPage'=>$row['entry_page'],'lastPage'=>$row['last_page'],'ip'=>$this->canFullIp($admin)?$full:self::maskIp($full),'customerId'=>$row['customer_id'],'customerName'=>$customer['customerName']??null,'kind'=>$row['customer_id']?'customer':'guest','device'=>$row['device_category'],'os'=>$row['os_name'],'browser'=>trim($row['browser_name'].' '.$row['browser_version']),'screen'=>$row['screen_resolution'],'viewport'=>$row['viewport_resolution'],'orientation'=>$row['orientation'],'country'=>$row['country'],'state'=>$row['state'],'city'=>$row['city'],'returning'=>(bool)$row['is_returning'],'active'=>strtotime($row['last_activity'])>=time()-300];}
        if(!$export)return [200,['success'=>true,'page'=>$page,'total'=>$total,'totalPages'=>(int)ceil($total/$limit),'data'=>$rows]];
        if(!$this->canFullIp($admin))throw new HttpError(403,'Visitor export requires additional authorization.');$csv="Visit ID,First visit IST,Last activity IST,IP,Type,Customer ID,Customer,Device,OS,Browser,Entry page,Last page,Duration seconds\r\n";
        foreach($rows as $row)$csv.=$this->csv([$row['visitId'],$this->ist($row['firstVisit']),$this->ist($row['lastActivity']),$row['ip'],$row['kind'],$row['customerId'],$row['customerName'],$row['device'],$row['os'],$row['browser'],$row['entryPage'],$row['lastPage'],$row['durationSeconds']]);
        return new CsvResponse($csv,'visitor-logs-'.gmdate('Y-m-d').'.csv');
    }
    private function group(string $column,string $range,array $args):array {$q=$this->pdo->prepare("SELECT $column label,COUNT(*) value FROM visitor_sessions$range GROUP BY $column ORDER BY value DESC LIMIT 12");$q->execute($args);return $q->fetchAll(\PDO::FETCH_ASSOC);}
    private function traffic(string $expression,string $label,int $limit,string $range,array $args):array {$q=$this->pdo->prepare("SELECT $expression `$label`,COUNT(*) value FROM visitor_pageviews$range GROUP BY $expression ORDER BY `$label` DESC LIMIT $limit");$q->execute($args);return array_reverse($q->fetchAll(\PDO::FETCH_ASSOC));}
    private function pages(string $range,array $args):array {$q=$this->pdo->prepare('SELECT path label,COUNT(*) value FROM visitor_pageviews'.$range.' GROUP BY path ORDER BY value DESC LIMIT 12');$q->execute($args);return $q->fetchAll(\PDO::FETCH_ASSOC);}
    private function purge():void {$days=max(7,min(730,(int)($this->settings['analytics']['retentionDays']??180)));$this->pdo->prepare('DELETE FROM visitor_sessions WHERE last_activity<DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? DAY)')->execute([$days]);}
    private function requireAvailable():void {if(empty($this->settings['analytics']['enabled']))throw new HttpError(503,'Visitor analytics is disabled.');if(!$this->pdo)throw new HttpError(503,$this->unavailable??'Visitor analytics storage is unavailable.');}
    private function validateSecrets():void {foreach(['ipEncryptionKey','ipHashKey','visitorHashKey']as $key)if(strlen((string)($this->settings['analytics'][$key]??''))<32)throw new \RuntimeException('Analytics secrets are not configured');}
    private function canFullIp(array $admin):bool {return in_array($admin['_id']??'',(array)($this->settings['analytics']['fullIpAdminIds']??[]),true);}
    private function hashValue(string $value,string $key):string {return hash_hmac('sha256',$value,(string)$this->settings['analytics'][$key]);}
    private function encryptIp(string $ip):string {$key=hash('sha256',(string)$this->settings['analytics']['ipEncryptionKey'],true);$iv=random_bytes(12);$tag='';$cipher=openssl_encrypt($ip,'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag);if($cipher===false)throw new \RuntimeException('IP encryption failed');return base64_encode($iv.$tag.$cipher);}
    private function decryptIp(string $payload):string {$raw=base64_decode($payload,true);if($raw===false||strlen($raw)<29)return 'Unknown';$key=hash('sha256',(string)$this->settings['analytics']['ipEncryptionKey'],true);return openssl_decrypt(substr($raw,28),'aes-256-gcm',$key,OPENSSL_RAW_DATA,substr($raw,0,12),substr($raw,12,16))?:'Unknown';}
    private function text(mixed $value,int $max,string $field,bool $empty=true):string {$value=trim((string)$value);if((!$empty&&$value==='')||mb_strlen($value)>$max)throw new HttpError(400,'Invalid '.$field.'.');return $value;}
    private function path(mixed $value):string {$value=$this->text($value,500,'page',false);if(!str_starts_with($value,'/')||str_contains($value,"\0"))throw new HttpError(400,'Invalid page.');return preg_replace('/[?#].*$/','',$value);}
    private function resolution(mixed $value):string {return preg_match('/^\d{2,5}x\d{2,5}$/D',(string)$value)?(string)$value:'Unknown';}
    private function date(mixed $value,bool $end):?string {if($value===null||$value==='')return null;$date=\DateTimeImmutable::createFromFormat('!Y-m-d',(string)$value,new \DateTimeZone('Asia/Kolkata'));if(!$date||$date->format('Y-m-d')!==$value)throw new HttpError(400,'Invalid date range.');if($end)$date=$date->modify('+1 day -1 millisecond');return $date->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');}
    private function ist(string $value):string {return (new \DateTimeImmutable($value))->setTimezone(new \DateTimeZone('Asia/Kolkata'))->format('Y-m-d H:i:s');}
    private function csv(array $fields):string {return implode(',',array_map(fn($v)=>'"'.str_replace('"','""',(string)$v).'"',$fields))."\r\n";}
    public static function maskIp(string $ip):string {if(filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_IPV4)){$p=explode('.',$ip);return $p[0].'.'.$p[1].'.***.***';}if(filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_IPV6)){$p=explode(':',$ip);return implode(':',array_slice($p,0,2)).':****:****';}return 'Unknown';}
    public static function parseUserAgent(string $ua):array {$browser='Unknown';$version='';foreach(['Edg/'=>'Edge','OPR/'=>'Opera','Chrome/'=>'Chrome','Firefox/'=>'Firefox','Version/'=>'Safari']as $needle=>$name)if(($p=strpos($ua,$needle))!==false){$browser=$name;preg_match('/'.preg_quote($needle,'/').'([\d.]+)/',$ua,$m);$version=$m[1]??'';break;}$os=str_contains($ua,'Android')?'Android':(preg_match('/iPhone|iPad/',$ua)?'iOS':(str_contains($ua,'Windows')?'Windows':(str_contains($ua,'Mac OS')?'macOS':(str_contains($ua,'Linux')?'Linux':'Unknown'))));$device=preg_match('/iPad|Tablet/i',$ua)?'Tablet':(preg_match('/Mobile|Android|iPhone/i',$ua)?'Mobile':'Desktop');return compact('browser','version','os','device');}
    public static function clientIp(string $remote,string $forwarded,array $trusted):string {$remote=trim($remote);if(!filter_var($remote,FILTER_VALIDATE_IP))return 'Unknown';if(!self::inCidrs($remote,$trusted)||$forwarded==='')return $remote;$chain=array_values(array_filter(array_map('trim',explode(',',$forwarded)),fn($v)=>filter_var($v,FILTER_VALIDATE_IP)));$chain[]=$remote;for($i=count($chain)-1;$i>=0;$i--)if(!self::inCidrs($chain[$i],$trusted))return $chain[$i];return $chain[0]??$remote;}
    private static function inCidrs(string $ip,array $cidrs):bool {$packed=inet_pton($ip);if($packed===false)return false;foreach($cidrs as $cidr){[$network,$bits]=array_pad(explode('/',(string)$cidr,2),2,null);$net=inet_pton($network);if($net===false||strlen($net)!==strlen($packed))continue;$bits=$bits===null?strlen($net)*8:(int)$bits;if($bits<0||$bits>strlen($net)*8)continue;$bytes=intdiv($bits,8);$rest=$bits%8;if(substr($packed,0,$bytes)!==substr($net,0,$bytes))continue;if($rest&&((ord($packed[$bytes])&(0xff<<(8-$rest)))!==(ord($net[$bytes])&(0xff<<(8-$rest)))))continue;return true;}return false;}
}
