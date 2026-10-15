<?php
declare(strict_types=1);
// CLI only. Running without --activate is read-only; activation requires a saved, current proposal.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/config.php';require __DIR__.'/router.php';
$store=new OMT\Store(OMT\db());$wallet=new OMT\Wallet($store);
$mode=$argv[1]??'audit';$reportPath=$argv[2]??'';
if(!in_array($mode,['audit','--activate'],true)||$reportPath==='')throw new RuntimeException('Usage: php wallet-audit.php audit|--activate /private/report.json');
if($mode==='audit'){
    $report=$store->transaction(function()use($store,$wallet){$rows=[];foreach($store->all('tiffins')as $person){
        if($wallet->account($person['_id']))continue;
        try{$proposal=$wallet->preview($person['_id']);unset($proposal['basis']);$rows[]=['customer'=>$person['_id'],'name'=>$person['customerName']??'',...$proposal];}
        catch(OMT\HttpError $e){$rows[]=['customer'=>$person['_id'],'name'=>$person['customerName']??'','issues'=>[$e->getMessage()]];}
    }return ['generatedAt'=>gmdate('c'),'customers'=>$rows];});
    if(file_exists($reportPath))throw new RuntimeException('Choose a new report filename; old audit evidence is preserved');
    if(file_put_contents($reportPath,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),LOCK_EX)===false)throw new RuntimeException('Cannot save audit');chmod($reportPath,0600);
    $clean=count(array_filter($report['customers'],fn($r)=>!$r['issues']));echo json_encode(['customers'=>count($report['customers']),'ready'=>$clean,'review'=>count($report['customers'])-$clean]),PHP_EOL;
}else{
    $report=json_decode(file_get_contents($reportPath),true,512,JSON_THROW_ON_ERROR);$result=['activated'=>0,'alreadyActive'=>0,'review'=>0,'stale'=>0];
    foreach($report['customers']as $row){if($row['issues']){$result['review']++;continue;}if($wallet->account($row['customer'])){$result['alreadyActive']++;continue;}
        try{$wallet->activate($row['customer'],$row['fingerprint'],'wallet-rollout');$result['activated']++;}catch(OMT\HttpError $e){if($e->status!==409)throw $e;$result['stale']++;}
    }echo json_encode($result),PHP_EOL;
}
