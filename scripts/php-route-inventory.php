<?php
declare(strict_types=1);
require dirname(__DIR__).'/backend-bigrock/router.php';
final class InventoryStore extends OMT\Store {public function __construct(){}}
echo json_encode((new OMT\Router(new InventoryStore(),['JWT_SECRET'=>'synthetic-inventory-secret','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret']))->inventory(),JSON_THROW_ON_ERROR);
