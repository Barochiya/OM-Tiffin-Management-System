<?php
declare(strict_types=1);
require dirname(__DIR__).'/security.php';
require dirname(__DIR__).'/store.php';
require dirname(__DIR__).'/catalog.php';
require dirname(__DIR__).'/ranking.php';
require dirname(__DIR__).'/dashboard.php';
final class RankingStore extends OMT\Store {
    public array $records=[];public function __construct(){}
    public function all(string $collection):array{return array_values($this->records[$collection]??[]);}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
}
function check(bool $value,string $message):void{if(!$value)throw new RuntimeException($message);}
$s=new RankingStore();
for($i=1;$i<=7;$i++){$customer=str_pad((string)$i,24,'0',STR_PAD_LEFT);$bill=str_pad((string)($i+20),24,'0',STR_PAD_LEFT);$payment=str_pad((string)($i+40),24,'0',STR_PAD_LEFT);$s->records['tiffins'][$customer]=['_id'=>$customer,'customerName'=>'Customer '.$i,'status'=>'Active'];$s->records['bills'][$bill]=['_id'=>$bill,'customer'=>$customer,'year'=>2026,'month'=>11,'cycle'=>2];$s->records['payments'][$payment]=['_id'=>$payment,'bill'=>$bill,'customer'=>$customer,'amount'=>(8-$i)*100,'status'=>'Success','paymentDate'=>'2026-11-20T00:00:00Z'];}
$target=str_pad('7',24,'0',STR_PAD_LEFT);$result=(new OMT\CustomerRanking($s))->forCustomer($target)[1]['data'];
check($result['rank']===7,'Personal rank must include customers outside top five');check($result['totalEligible']===7,'Eligible count mismatch');check($result['topFive']===false,'Top five status mismatch');check($result['score']===100.0,'Ranking score mismatch');
$dashboard=(new OMT\Dashboard($s))->get([],new DateTimeImmutable('2026-11-26T00:00:00+05:30'))[1];
$expected=[];for($i=1;$i<=5;$i++)$expected[]=str_pad((string)$i,24,'0',STR_PAD_LEFT);
check(array_column($dashboard['topCustomers'],'_id')===$expected,'Existing dashboard ordering changed');
$before=serialize($s->records);(new OMT\CustomerRanking($s))->forCustomer($target);check($before===serialize($s->records),'Ranking must be read-only');
echo "PASS personal ranking: full eligible rank, top-five consistency and read-only data access.\n";
